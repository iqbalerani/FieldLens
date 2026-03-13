from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.entities import InspectionStatus, IssueSeverity, MediaType


class RequestedMediaInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    type: MediaType
    mime_type: str = Field(alias="mimeType")
    size_bytes: int = Field(alias="sizeBytes")
    file_name: str = Field(alias="fileName")


class CreateInspectionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    site_name: str = Field(alias="siteName")
    inspection_type: str = Field(alias="inspectionType")
    inspector_name: str = Field(alias="inspectorName")
    latitude: float | None = None
    longitude: float | None = None
    text_notes: str | None = Field(default=None, alias="textNotes")
    requested_media: list[RequestedMediaInput] = Field(default_factory=list, alias="requestedMedia")


class MediaUploadTarget(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    type: MediaType
    s3_key: str = Field(alias="s3Key")
    mime_type: str = Field(alias="mimeType")
    size_bytes: int = Field(alias="sizeBytes")
    upload_url: str | None = Field(default=None, alias="uploadUrl")
    preview_url: str | None = Field(default=None, alias="previewUrl")


class CreateInspectionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    inspection_id: str = Field(alias="inspectionId")
    upload_targets: list[MediaUploadTarget] = Field(alias="uploadTargets")


class RegisterMediaInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    s3_key: str = Field(alias="s3Key")
    mime_type: str = Field(alias="mimeType")
    size_bytes: int = Field(alias="sizeBytes")
    type: MediaType


class RegisterInspectionMediaRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    media: list[RegisterMediaInput]
    voice_transcript: str | None = Field(default=None, alias="voiceTranscript")


class SubmitInspectionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    inspection_id: str = Field(alias="inspectionId")
    status: InspectionStatus


class InspectionIssueResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str | None = None
    title: str
    description: str
    severity: IssueSeverity
    affected_area: str = Field(alias="affectedArea")
    suggested_action: str = Field(alias="suggestedAction")
    photo_reference_index: int | None = Field(default=None, alias="photoReferenceIndex")


class InspectionReportResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    summary: str
    overall_status: str = Field(alias="overallStatus")
    confidence_score: float = Field(alias="confidenceScore")
    issues: list[InspectionIssueResponse]
    recommendations: list[str]
    missing_info: list[str] = Field(alias="missingInfo")
    comparison_with_prior: str = Field(alias="comparisonWithPrior")


class InspectionSummaryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    org_id: str = Field(alias="orgId")
    site_id: str = Field(alias="siteId")
    site_name: str = Field(alias="siteName")
    inspection_type: str = Field(alias="inspectionType")
    inspector_name: str = Field(alias="inspectorName")
    status: InspectionStatus
    created_at: datetime = Field(alias="createdAt")
    submitted_at: datetime | None = Field(default=None, alias="submittedAt")
    processed_at: datetime | None = Field(default=None, alias="processedAt")
    summary: str | None = None
    overall_status: str | None = Field(default=None, alias="overallStatus")
    issue_count: int = Field(alias="issueCount")
    critical_count: int = Field(alias="criticalCount")
    transcript_excerpt: str | None = Field(default=None, alias="transcriptExcerpt")


class InspectionDetailResponse(InspectionSummaryResponse):
    latitude: float | None = None
    longitude: float | None = None
    text_notes: str | None = Field(default=None, alias="textNotes")
    voice_transcript: str | None = Field(default=None, alias="voiceTranscript")
    report: InspectionReportResponse | None = None
    media: list[MediaUploadTarget]


class InspectionStatusResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    inspection_id: str = Field(alias="inspectionId")
    status: InspectionStatus
