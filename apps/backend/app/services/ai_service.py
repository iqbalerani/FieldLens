import base64
import json
import math
import re
from collections import Counter
from typing import Any

import boto3

from app.core.config import get_settings


SYSTEM_PROMPT = (
    "You are FieldLens AI, an expert inspection analyst. "
    "Return valid JSON with the keys summary, overall_status, confidence_score, "
    "issues, recommendations, missing_info, and comparison_with_prior."
)


class AIServiceError(Exception):
    pass


class AIService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._bedrock_runtime = None
        self._bedrock_control = None

    @property
    def bedrock_runtime(self):
        if self._bedrock_runtime is None:
            self._bedrock_runtime = boto3.client("bedrock-runtime", region_name=self.settings.aws_region)
        return self._bedrock_runtime

    @property
    def bedrock_control(self):
        if self._bedrock_control is None:
            self._bedrock_control = boto3.client("bedrock", region_name=self.settings.aws_region)
        return self._bedrock_control

    def check_health(self) -> None:
        if not self.settings.bedrock_enabled:
            return
        self.bedrock_control.list_foundation_models(byProvider="Amazon")

    def embed_text(self, text: str, *, query: bool = False) -> list[float]:
        if not text.strip():
            return self._zero_embedding()
        if self.settings.bedrock_enabled:
            return self._embed_text_bedrock(
                text,
                task_type=self.settings.nova_embed_query_task_type if query else self.settings.nova_embed_document_task_type,
            )
        return self._embed_text_mock(text)

    def embed_image(self, image_bytes: bytes, *, image_format: str = "jpeg") -> list[float]:
        if not image_bytes:
            return self._zero_embedding()
        if self.settings.bedrock_enabled:
            return self._embed_image_bedrock(
                image_bytes=image_bytes,
                image_format=image_format,
                task_type=self.settings.nova_embed_image_task_type,
            )
        return self._embed_text_mock(f"image:{len(image_bytes)}:{image_format}")

    def build_inspection_embedding(
        self,
        *,
        site_name: str,
        transcript: str,
        text_notes: str,
        report_summary: str,
        preprocessed_images: list[dict[str, Any]] | None = None,
    ) -> list[float]:
        vectors: list[list[float]] = []
        text_blob = " ".join(part for part in [site_name, transcript, text_notes, report_summary] if part).strip()
        if text_blob:
            vectors.append(self.embed_text(text_blob))

        for image in preprocessed_images or []:
            image_bytes = image.get("bytes")
            if image_bytes:
                vectors.append(self.embed_image(image_bytes, image_format=image.get("format", "jpeg")))

        return self._average_embeddings(vectors) if vectors else self._zero_embedding()

    def generate_report(
        self,
        *,
        site_name: str,
        inspection_type: str,
        inspector_name: str,
        transcript: str,
        text_notes: str,
        similar_inspections: list[dict[str, Any]],
        media_count: int,
        preprocessed_images: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        if self.settings.bedrock_enabled:
            return self._generate_report_bedrock(
                site_name=site_name,
                inspection_type=inspection_type,
                inspector_name=inspector_name,
                transcript=transcript,
                text_notes=text_notes,
                similar_inspections=similar_inspections,
                media_count=media_count,
                preprocessed_images=preprocessed_images or [],
            )
        return self._generate_report_mock(
            site_name=site_name,
            inspection_type=inspection_type,
            inspector_name=inspector_name,
            transcript=transcript,
            text_notes=text_notes,
            similar_inspections=similar_inspections,
            media_count=media_count,
        )

    def _zero_embedding(self) -> list[float]:
        return [0.0] * self.settings.nova_embed_dimensions

    def _average_embeddings(self, vectors: list[list[float]]) -> list[float]:
        if not vectors:
            return self._zero_embedding()
        length = min(len(vector) for vector in vectors)
        averaged = [
            sum(vector[index] for vector in vectors) / len(vectors)
            for index in range(length)
        ]
        norm = math.sqrt(sum(value * value for value in averaged)) or 1.0
        return [value / norm for value in averaged]

    def _embed_text_mock(self, text: str) -> list[float]:
        buckets = [0.0] * self.settings.nova_embed_dimensions
        tokens = text.lower().split()
        if not tokens:
            return buckets
        counts = Counter(tokens)
        for token, count in counts.items():
            index = sum(ord(char) for char in token) % len(buckets)
            buckets[index] += float(count)
        norm = math.sqrt(sum(value * value for value in buckets)) or 1.0
        return [value / norm for value in buckets]

    def _invoke_embedding_model(self, body: dict[str, Any]) -> dict[str, Any]:
        try:
            response = self.bedrock_runtime.invoke_model(
                modelId=self.settings.nova_embed_model_id,
                body=json.dumps(body),
                accept="application/json",
                contentType="application/json",
            )
        except Exception as exc:  # pragma: no cover - depends on AWS credentials
            raise AIServiceError(f"Nova embeddings request failed: {exc}") from exc

        payload = json.loads(response["body"].read())
        try:
            return payload
        except Exception as exc:  # pragma: no cover - defensive
            raise AIServiceError("Nova embeddings response could not be parsed") from exc

    def _embed_text_bedrock(self, text: str, *, task_type: str) -> list[float]:
        payload = self._invoke_embedding_model(
            {
                "inputType": task_type,
                "texts": [text],
                "embeddingTypes": ["float"],
                "dimension": self.settings.nova_embed_dimensions,
            }
        )
        try:
            return payload["embeddingsByType"]["float"][0]
        except (KeyError, IndexError) as exc:
            raise AIServiceError("Nova embeddings response missing float embeddings") from exc

    def _embed_image_bedrock(self, *, image_bytes: bytes, image_format: str, task_type: str) -> list[float]:
        payload = self._invoke_embedding_model(
            {
                "inputType": task_type,
                "images": [
                    {
                        "format": image_format,
                        "source": {
                            "bytes": base64.b64encode(image_bytes).decode("utf-8"),
                        },
                    }
                ],
                "embeddingTypes": ["float"],
                "dimension": self.settings.nova_embed_dimensions,
            }
        )
        try:
            return payload["embeddingsByType"]["float"][0]
        except (KeyError, IndexError) as exc:
            raise AIServiceError("Nova image embedding response missing float embeddings") from exc

    def _generate_report_mock(
        self,
        *,
        site_name: str,
        inspection_type: str,
        inspector_name: str,
        transcript: str,
        text_notes: str,
        similar_inspections: list[dict[str, Any]],
        media_count: int,
    ) -> dict[str, Any]:
        combined = f"{transcript} {text_notes}".lower()
        issues: list[dict[str, Any]] = []

        if "crack" in combined:
            issues.append(
                {
                    "title": "Structural cracking observed",
                    "description": "Visible cracking suggests a structural review is needed.",
                    "severity": "CRITICAL",
                    "affected_area": "Primary wall structure",
                    "suggested_action": "Secure the area and schedule an engineering inspection within 24 hours.",
                    "photo_reference_index": 0 if media_count else None,
                }
            )
        if "missing" in combined or "signage" in combined:
            issues.append(
                {
                    "title": "Safety signage gap",
                    "description": "Required signage appears missing or incomplete.",
                    "severity": "WARNING",
                    "affected_area": "Entrance and access path",
                    "suggested_action": "Install compliant signage before the next shift starts.",
                    "photo_reference_index": 1 if media_count > 1 else 0 if media_count else None,
                }
            )
        if not issues:
            issues.append(
                {
                    "title": "Routine follow-up recommended",
                    "description": "No urgent defects were inferred from the submitted evidence.",
                    "severity": "INFO",
                    "affected_area": "General site conditions",
                    "suggested_action": "Maintain standard inspection cadence and monitor for changes.",
                    "photo_reference_index": 0 if media_count else None,
                }
            )

        overall = "FAIL" if any(issue["severity"] == "CRITICAL" for issue in issues) else "WARN" if any(issue["severity"] == "WARNING" for issue in issues) else "PASS"
        return {
            "summary": f"{inspection_type} inspection for {site_name} recorded by {inspector_name}. {len(issues)} issue(s) identified from transcript and notes.",
            "overall_status": overall,
            "confidence_score": 0.86 if transcript or text_notes else 0.62,
            "issues": issues,
            "recommendations": [issue["suggested_action"] for issue in issues],
            "missing_info": [] if media_count else ["Add at least one supporting photo for stronger evidence."],
            "comparison_with_prior": (
                f"Compared against {len(similar_inspections)} prior inspection(s); similar patterns were used as context."
                if similar_inspections
                else "No prior inspections were available for comparison."
            ),
        }

    def _generate_report_bedrock(
        self,
        *,
        site_name: str,
        inspection_type: str,
        inspector_name: str,
        transcript: str,
        text_notes: str,
        similar_inspections: list[dict[str, Any]],
        media_count: int,
        preprocessed_images: list[dict[str, Any]],
    ) -> dict[str, Any]:
        content: list[dict[str, Any]] = [
            {
                "text": (
                    f"Site: {site_name}\n"
                    f"Type: {inspection_type}\n"
                    f"Inspector: {inspector_name}\n"
                    f"Transcript: {transcript or 'None'}\n"
                    f"Text notes: {text_notes or 'None'}\n"
                    f"Similar inspections: {json.dumps(similar_inspections[:3])}\n"
                    f"Media count: {media_count}\n"
                    "Interpret photos in the context of the inspection.\n"
                    "Return only valid JSON with snake_case keys."
                )
            }
        ]
        for image in preprocessed_images:
            image_bytes = image.get("bytes")
            if not image_bytes:
                continue
            content.append(
                {
                    "image": {
                        "format": image.get("format", "jpeg"),
                        "source": {"bytes": image_bytes},
                    }
                }
            )

        try:
            response = self.bedrock_runtime.converse(
                modelId=self.settings.nova_lite_model_id,
                system=[{"text": SYSTEM_PROMPT}],
                messages=[{"role": "user", "content": content}],
                inferenceConfig={"maxTokens": 1200, "temperature": 0.2},
            )
        except Exception as exc:  # pragma: no cover - depends on AWS credentials
            raise AIServiceError(f"Nova Lite request failed: {exc}") from exc

        text_chunks = [
            block.get("text", "")
            for block in response["output"]["message"]["content"]
            if "text" in block
        ]
        raw = "".join(text_chunks).strip()
        cleaned = self._clean_json_payload(raw)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise AIServiceError(f"Nova Lite returned invalid JSON: {raw}") from exc

    def _clean_json_payload(self, raw: str) -> str:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            cleaned = cleaned.removeprefix("json").strip()

        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        return match.group(0) if match else cleaned


ai_service = AIService()
