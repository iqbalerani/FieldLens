import json
import math
from collections import Counter
from typing import Any

import boto3

from app.core.config import get_settings


SYSTEM_PROMPT = (
    "You are FieldLens AI, an expert inspection analyst. Return only valid JSON "
    "with summary, overall_status, confidence_score, issues, recommendations, "
    "missing_info, and comparison_with_prior."
)


class AIService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._bedrock = None

    @property
    def bedrock(self):
        if self._bedrock is None:
            self._bedrock = boto3.client("bedrock-runtime", region_name=self.settings.aws_region)
        return self._bedrock

    def embed_text(self, text: str) -> list[float]:
        if self.settings.ai_mode == "bedrock":
            try:
                return self._embed_text_bedrock(text)
            except Exception:
                pass
        return self._embed_text_mock(text)

    def _embed_text_mock(self, text: str) -> list[float]:
        buckets = [0.0] * 32
        tokens = text.lower().split()
        if not tokens:
            return buckets
        counts = Counter(tokens)
        for token, count in counts.items():
            index = sum(ord(char) for char in token) % len(buckets)
            buckets[index] += float(count)
        norm = math.sqrt(sum(value * value for value in buckets)) or 1.0
        return [value / norm for value in buckets]

    def _embed_text_bedrock(self, text: str) -> list[float]:
        body = json.dumps({"inputText": text})
        response = self.bedrock.invoke_model(
            modelId=self.settings.nova_embed_model_id,
            body=body,
            accept="application/json",
            contentType="application/json",
        )
        payload = json.loads(response["body"].read())
        return payload.get("embedding") or payload.get("embeddingsByType", {}).get("text") or self._embed_text_mock(text)

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
        images = preprocessed_images or []
        if self.settings.ai_mode == "bedrock":
            try:
                return self._generate_report_bedrock(
                    site_name=site_name,
                    inspection_type=inspection_type,
                    inspector_name=inspector_name,
                    transcript=transcript,
                    text_notes=text_notes,
                    similar_inspections=similar_inspections,
                    media_count=media_count,
                    preprocessed_images=images,
                )
            except Exception:
                pass
        return self._generate_report_mock(
            site_name=site_name,
            inspection_type=inspection_type,
            inspector_name=inspector_name,
            transcript=transcript,
            text_notes=text_notes,
            similar_inspections=similar_inspections,
            media_count=media_count,
        )

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
        preprocessed_images: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        text_part = {
            "text": (
                f"Site: {site_name}\n"
                f"Type: {inspection_type}\n"
                f"Inspector: {inspector_name}\n"
                f"Transcript: {transcript or 'None'}\n"
                f"Text notes: {text_notes or 'None'}\n"
                f"Similar inspections: {json.dumps(similar_inspections[:3])}\n"
                f"Media count: {media_count}\n"
                "Return only valid JSON with snake_case keys."
            )
        }
        content: list[dict[str, Any]] = [text_part]
        for img in (preprocessed_images or []):
            content.append(
                {
                    "image": {
                        "format": "jpeg",
                        "source": {"bytes": bytes.fromhex(img["base64"]) if isinstance(img["base64"], str) else img["base64"]},
                    }
                }
            )
        response = self.bedrock.converse(
            modelId=self.settings.nova_lite_model_id,
            system=[{"text": SYSTEM_PROMPT}],
            messages=[{"role": "user", "content": content}],
        )
        text_chunks = [
            block.get("text", "")
            for block in response["output"]["message"]["content"]
            if "text" in block
        ]
        raw = "".join(text_chunks).strip()
        # Strip markdown fences if Nova returns them despite instructions
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())


ai_service = AIService()
