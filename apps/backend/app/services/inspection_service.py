import io
import logging
from datetime import UTC, datetime
from typing import Any

import boto3
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.events import broker
from app.models import Inspection, InspectionIssue, InspectionMedia, InspectionStatus, SearchQuery, Site, User, VoiceTranscript
from app.schemas.inspection import CreateInspectionRequest, RegisterInspectionMediaRequest
from app.services.ai_service import ai_service
from app.services.search_service import find_similar_inspections
from app.services.storage_service import storage_service

logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _notify_critical_issues(inspection_id: str, site_name: str, issues: list[dict[str, Any]]) -> None:
    """Fire-and-forget SNS notification when CRITICAL issues are found."""
    settings = get_settings()
    if not settings.sns_topic_arn:
        return
    critical = [i for i in issues if i.get("severity") == "CRITICAL"]
    if not critical:
        return
    try:
        sns = boto3.client("sns", region_name=settings.aws_region)
        lines = [f"• {i['title']}: {i.get('description', '')}" for i in critical]
        message = (
            f"FieldLens Alert — CRITICAL issues at {site_name}\n\n"
            + "\n".join(lines)
            + f"\n\nInspection ID: {inspection_id}"
        )
        sns.publish(
            TopicArn=settings.sns_topic_arn,
            Subject=f"[FieldLens] Critical Issues — {site_name}",
            Message=message,
        )
    except Exception as exc:
        logger.warning("SNS publish failed: %s", exc)


def _preprocess_media_files(inspection: Inspection) -> list[dict[str, Any]]:
    """Load, validate, and normalize media files for AI ingestion.

    Images are resized to at most 1024 px on the longest edge and returned as
    raw JPEG bytes ready for Nova Lite and Nova embeddings.
    """
    try:
        from PIL import Image
    except ImportError:
        return []

    settings = get_settings()
    processed: list[dict[str, Any]] = []
    for media in inspection.media:
        if media.type.value != "photo":
            continue
        try:
            img = Image.open(io.BytesIO(storage_service.read_bytes(media.s3_key))).convert("RGB")
            max_side = 1024
            w, h = img.size
            if max(w, h) > max_side:
                scale = max_side / max(w, h)
                img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85)
            processed.append(
                {
                    "id": media.id,
                    "mime_type": "image/jpeg",
                    "format": "jpeg",
                    "bytes": buf.getvalue(),
                }
            )
        except Exception as exc:
            logger.warning("Image preprocessing failed for %s: %s", media.id, exc)
    return processed


async def get_or_create_site(session: AsyncSession, user: User, payload: CreateInspectionRequest) -> Site:
    result = await session.execute(select(Site).where(Site.org_id == user.org_id, Site.name == payload.site_name))
    site = result.scalar_one_or_none()
    if site is None:
        site = Site(
            org_id=user.org_id,
            name=payload.site_name,
            latitude=payload.latitude,
            longitude=payload.longitude,
            type=payload.inspection_type,
        )
        session.add(site)
        await session.flush()
    return site


async def create_inspection(session: AsyncSession, user: User, payload: CreateInspectionRequest) -> tuple[Inspection, list[InspectionMedia]]:
    site = await get_or_create_site(session, user, payload)
    inspection = Inspection(
        org_id=user.org_id,
        site_id=site.id,
        user_id=user.id,
        site_name=payload.site_name,
        inspection_type=payload.inspection_type,
        inspector_name=payload.inspector_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        text_notes=payload.text_notes,
        status=InspectionStatus.DRAFT,
    )
    session.add(inspection)
    await session.flush()

    media_items: list[InspectionMedia] = []
    for requested_media in payload.requested_media:
        media = InspectionMedia(
            inspection_id=inspection.id,
            type=requested_media.type,
            s3_key=storage_service.build_media_key(inspection.id, requested_media.file_name),
            mime_type=requested_media.mime_type,
            size_bytes=requested_media.size_bytes,
        )
        session.add(media)
        media_items.append(media)

    await session.flush()
    inspection.status = InspectionStatus.UPLOADING if media_items else InspectionStatus.DRAFT
    await session.flush()
    return inspection, media_items


async def register_media(session: AsyncSession, inspection: Inspection, payload: RegisterInspectionMediaRequest) -> Inspection:
    media_by_id = {media.id: media for media in inspection.media}
    for item in payload.media:
        media = media_by_id.get(item.id)
        if media is None:
            media = InspectionMedia(
                id=item.id,
                inspection_id=inspection.id,
                type=item.type,
                s3_key=item.s3_key,
                mime_type=item.mime_type,
                size_bytes=item.size_bytes,
            )
            session.add(media)
        media.s3_key = item.s3_key
        media.mime_type = item.mime_type
        media.size_bytes = item.size_bytes
        media.preview_url = None

    if payload.voice_transcript:
        if inspection.transcript is None:
            inspection.transcript = VoiceTranscript(
                inspection_id=inspection.id,
                transcript_text=payload.voice_transcript,
                word_count=len(payload.voice_transcript.split()),
            )
        else:
            inspection.transcript.transcript_text = payload.voice_transcript
            inspection.transcript.word_count = len(payload.voice_transcript.split())

    inspection.status = InspectionStatus.SUBMITTED
    inspection.submitted_at = utc_now()
    await session.flush()
    await broker.publish(inspection.org_id, {"type": "inspection_submitted", "inspectionId": inspection.id})
    return inspection


async def process_inspection(session: AsyncSession, inspection: Inspection) -> Inspection:
    inspection.status = InspectionStatus.PROCESSING
    await session.flush()
    await broker.publish(inspection.org_id, {"type": "processing_started", "inspectionId": inspection.id})

    # Inline media preprocessing (replaces Lambda S3 trigger)
    preprocessed_images = _preprocess_media_files(inspection)

    transcript = inspection.transcript.transcript_text if inspection.transcript else ""
    similar = await find_similar_inspections(
        session,
        inspection.org_id,
        f"{inspection.site_name} {transcript} {inspection.text_notes or ''}",
        exclude_inspection_id=inspection.id,
        limit=3,
    )
    similar_context = [
        {
            "id": match.id,
            "site_name": match.site_name,
            "summary": (match.report or {}).get("summary"),
            "overall_status": (match.report or {}).get("overall_status"),
        }
        for match, _score in similar
    ]

    report = ai_service.generate_report(
        site_name=inspection.site_name,
        inspection_type=inspection.inspection_type,
        inspector_name=inspection.inspector_name,
        transcript=transcript,
        text_notes=inspection.text_notes or "",
        similar_inspections=similar_context,
        media_count=len(inspection.media),
        preprocessed_images=preprocessed_images,
    )
    inspection.report = report
    try:
        inspection.embedding = ai_service.build_inspection_embedding(
            site_name=inspection.site_name,
            transcript=transcript,
            text_notes=inspection.text_notes or "",
            report_summary=report.get("summary", ""),
            preprocessed_images=preprocessed_images,
        )
    except Exception as exc:
        logger.warning("Embedding generation failed, using zero vector: %s", exc)
        inspection.embedding = ai_service._zero_embedding()

    for existing_issue in list(inspection.issues):
        await session.delete(existing_issue)
    for issue in report.get("issues", []):
        session.add(
            InspectionIssue(
                inspection_id=inspection.id,
                title=issue.get("title") or "Issue detected",
                severity=issue.get("severity", "INFO"),
                description=issue.get("description", ""),
                affected_area=issue.get("affected_area", ""),
                suggested_action=issue.get("suggested_action", ""),
                photo_reference_index=issue.get("photo_reference_index"),
            )
        )

    inspection.status = InspectionStatus.COMPLETE
    inspection.processed_at = utc_now()
    await session.flush()
    await broker.publish(inspection.org_id, {"type": "report_ready", "inspectionId": inspection.id})

    # SNS alert for CRITICAL issues
    _notify_critical_issues(inspection.id, inspection.site_name, report.get("issues", []))

    return inspection


async def trend_points(session: AsyncSession, org_id: str) -> list[dict[str, Any]]:
    inspections = (await session.execute(select(Inspection).where(Inspection.org_id == org_id))).scalars().all()

    buckets: dict[str, dict[str, Any]] = {}
    for inspection in inspections:
        date = inspection.created_at.date().isoformat()
        bucket = buckets.setdefault(
            date,
            {"date": date, "totalInspections": 0, "criticalIssues": 0, "warningIssues": 0, "infoIssues": 0},
        )
        bucket["totalInspections"] += 1
        for issue in inspection.issues:
            if issue.severity == "CRITICAL":
                bucket["criticalIssues"] += 1
            elif issue.severity == "WARNING":
                bucket["warningIssues"] += 1
            else:
                bucket["infoIssues"] += 1
    return [buckets[key] for key in sorted(buckets)]


async def log_search(session: AsyncSession, user_id: str, query_text: str, result_count: int) -> None:
    from app.services.ai_service import AIServiceError
    try:
        embedding = ai_service.embed_text(query_text, query=True)
    except AIServiceError as exc:
        logger.warning("Embedding unavailable for search log, using zero vector: %s", exc)
        embedding = ai_service._zero_embedding()
    session.add(
        SearchQuery(
            user_id=user_id,
            query_text=query_text,
            query_embedding=embedding,
            result_count=result_count,
        )
    )
    await session.flush()
