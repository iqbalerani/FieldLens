import logging
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)

from app.core.database import SessionLocal, get_db
from app.core.events import broker
from app.core.security import get_current_user, get_current_user_model
from app.models import Inspection, InspectionStatus, User
from app.schemas.auth import CurrentUserResponse
from app.schemas.inspection import (
    CreateInspectionRequest,
    CreateInspectionResponse,
    InspectionDetailResponse,
    InspectionStatusResponse,
    InspectionSummaryResponse,
    MediaUploadTarget,
    RegisterInspectionMediaRequest,
    SubmitInspectionResponse,
)
from app.services.inspection_service import create_inspection, process_inspection, register_media
from app.services.storage_service import storage_service

router = APIRouter(prefix="/inspections", tags=["inspections"])


def serialize_summary(inspection: Inspection) -> InspectionSummaryResponse:
    issues = inspection.report.get("issues", []) if inspection.report else []
    critical_count = len([issue for issue in issues if issue.get("severity") == "CRITICAL"])
    transcript = inspection.transcript.transcript_text if inspection.transcript else None
    return InspectionSummaryResponse(
        id=inspection.id,
        orgId=inspection.org_id,
        siteId=inspection.site_id,
        siteName=inspection.site_name,
        inspectionType=inspection.inspection_type,
        inspectorName=inspection.inspector_name,
        status=inspection.status,
        createdAt=inspection.created_at,
        submittedAt=inspection.submitted_at,
        processedAt=inspection.processed_at,
        summary=(inspection.report or {}).get("summary"),
        overallStatus=(inspection.report or {}).get("overall_status"),
        issueCount=len(issues),
        criticalCount=critical_count,
        transcriptExcerpt=transcript[:120] if transcript else None,
    )


def _get(d: dict, *keys: str, default=None):
    """Return first matching key from a dict — supports both snake_case and camelCase variants."""
    for key in keys:
        if key in d:
            return d[key]
    return default


def serialize_detail(inspection: Inspection) -> InspectionDetailResponse:
    media = [
        MediaUploadTarget(
            id=item.id,
            type=item.type,
            s3Key=item.s3_key,
            mimeType=item.mime_type,
            sizeBytes=item.size_bytes,
            uploadUrl=None,
            previewUrl=storage_service.preview_url(item.s3_key),
        )
        for item in inspection.media
    ]
    report = inspection.report
    return InspectionDetailResponse(
        **serialize_summary(inspection).model_dump(),
        latitude=inspection.latitude,
        longitude=inspection.longitude,
        textNotes=inspection.text_notes,
        voiceTranscript=inspection.transcript.transcript_text if inspection.transcript else None,
        media=media,
        report={
            "summary": _get(report, "summary", default=""),
            "overallStatus": _get(report, "overall_status", "overallStatus", default="UNKNOWN"),
            "confidenceScore": _get(report, "confidence_score", "confidenceScore", default=0.0),
            "issues": [
                {
                    "id": issue.get("id"),
                    "title": _get(issue, "title", default=""),
                    "description": _get(issue, "description", default=""),
                    "severity": _get(issue, "severity", default="INFO"),
                    "affectedArea": _get(issue, "affected_area", "affectedArea", default=""),
                    "suggestedAction": _get(issue, "suggested_action", "suggestedAction", default=""),
                    "photoReferenceIndex": _get(issue, "photo_reference_index", "photoReferenceIndex"),
                }
                for issue in _get(report, "issues", default=[])
            ],
            "recommendations": _get(report, "recommendations", default=[]),
            "missingInfo": _get(report, "missing_info", "missingInfo", default=[]),
            "comparisonWithPrior": _get(report, "comparison_with_prior", "comparisonWithPrior", default=""),
        }
        if report
        else None,
    )


async def get_owned_inspection(session: AsyncSession, inspection_id: str, org_id: str) -> Inspection:
    inspection = (
        await session.execute(
            select(Inspection)
            .options(
                selectinload(Inspection.media),
                selectinload(Inspection.issues),
                selectinload(Inspection.transcript),
            )
            .where(Inspection.id == inspection_id, Inspection.org_id == org_id)
        )
    ).scalar_one_or_none()
    if inspection is None:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return inspection


async def process_in_background(inspection_id: str) -> None:
    async with SessionLocal() as session:
        inspection = (
            await session.execute(
                select(Inspection)
                .options(
                    selectinload(Inspection.media),
                    selectinload(Inspection.issues),
                    selectinload(Inspection.transcript),
                )
                .where(Inspection.id == inspection_id)
            )
        ).scalar_one_or_none()
        if inspection is None:
            return
        try:
            await process_inspection(session, inspection)
        except Exception:
            logger.exception("Inspection processing failed for inspection_id=%s", inspection_id)
            inspection.status = InspectionStatus.FAILED
            await broker.publish(inspection.org_id, {"type": "processing_failed", "inspectionId": inspection.id})
        await session.commit()


@router.post("", response_model=CreateInspectionResponse)
async def create(
    payload: CreateInspectionRequest,
    session: AsyncSession = Depends(get_db),
    current_user_model: User = Depends(get_current_user_model),
) -> CreateInspectionResponse:
    inspection, media_items = await create_inspection(session, current_user_model, payload)
    await session.commit()
    return CreateInspectionResponse(
        inspectionId=inspection.id,
        uploadTargets=[
            MediaUploadTarget(
                id=item.id,
                type=item.type,
                s3Key=item.s3_key,
                mimeType=item.mime_type,
                sizeBytes=item.size_bytes,
                uploadUrl=storage_service.create_upload_url(inspection.id, item.id, item.s3_key, item.mime_type),
                previewUrl=item.preview_url,
            )
            for item in media_items
        ],
    )


@router.get("", response_model=list[InspectionSummaryResponse])
async def list_inspections(
    status: InspectionStatus | None = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_db),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> list[InspectionSummaryResponse]:
    query = (
        select(Inspection)
        .options(selectinload(Inspection.transcript))
        .where(Inspection.org_id == current_user.org_id)
        .order_by(Inspection.created_at.desc())
        .limit(min(limit, 200))
        .offset(offset)
    )
    if status is not None:
        query = query.where(Inspection.status == status)
    inspections = (await session.execute(query)).scalars().all()
    return [serialize_summary(inspection) for inspection in inspections]


@router.get("/{inspection_id}", response_model=InspectionDetailResponse)
async def detail(
    inspection_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> InspectionDetailResponse:
    inspection = await get_owned_inspection(session, inspection_id, current_user.org_id)
    return serialize_detail(inspection)


@router.get("/{inspection_id}/status", response_model=InspectionStatusResponse)
async def status(
    inspection_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> InspectionStatusResponse:
    inspection = await get_owned_inspection(session, inspection_id, current_user.org_id)
    return InspectionStatusResponse(inspectionId=inspection.id, status=inspection.status)


@router.post("/{inspection_id}/media/complete", response_model=InspectionDetailResponse)
async def complete_media(
    inspection_id: str,
    payload: RegisterInspectionMediaRequest,
    session: AsyncSession = Depends(get_db),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> InspectionDetailResponse:
    inspection = await get_owned_inspection(session, inspection_id, current_user.org_id)
    inspection = await register_media(session, inspection, payload)
    await session.commit()
    return serialize_detail(inspection)


@router.post("/{inspection_id}/submit", response_model=SubmitInspectionResponse)
async def submit(
    inspection_id: str,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> SubmitInspectionResponse:
    inspection = await get_owned_inspection(session, inspection_id, current_user.org_id)
    if inspection.status not in {InspectionStatus.SUBMITTED, InspectionStatus.DRAFT, InspectionStatus.UPLOADING}:
        raise HTTPException(status_code=400, detail="Inspection cannot be submitted again")
    inspection.status = InspectionStatus.SUBMITTED
    inspection.submitted_at = inspection.submitted_at or datetime.utcnow()
    await session.commit()
    background_tasks.add_task(process_in_background, inspection.id)
    return SubmitInspectionResponse(inspectionId=inspection.id, status=inspection.status)


@router.post("/{inspection_id}/media/{media_id}/upload", response_model=MediaUploadTarget)
async def upload_media(
    inspection_id: str,
    media_id: str,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> MediaUploadTarget:
    inspection = await get_owned_inspection(session, inspection_id, current_user.org_id)
    media = next((item for item in inspection.media if item.id == media_id), None)
    if media is None:
        raise HTTPException(status_code=404, detail="Media target not found")

    await storage_service.save_upload(media.s3_key, file)
    media.preview_url = None
    media.mime_type = file.content_type or media.mime_type
    await session.commit()
    return MediaUploadTarget(
        id=media.id,
        type=media.type,
        s3Key=media.s3_key,
        mimeType=media.mime_type,
        sizeBytes=media.size_bytes,
        uploadUrl=None,
        previewUrl=storage_service.preview_url(media.s3_key),
    )
