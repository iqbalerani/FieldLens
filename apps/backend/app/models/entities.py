import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.types import EmbeddingVector


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SUPERVISOR = "SUPERVISOR"
    INSPECTOR = "INSPECTOR"


class InspectionStatus(str, enum.Enum):
    DRAFT = "draft"
    UPLOADING = "uploading"
    SUBMITTED = "submitted"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"


class MediaType(str, enum.Enum):
    PHOTO = "photo"
    AUDIO = "audio"


class IssueSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"


def default_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class Organisation(Base):
    __tablename__ = "organisations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    name: Mapped[str] = mapped_column(String(255))
    industry_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    settings: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    org_id: Mapped[str] = mapped_column(ForeignKey("organisations.id"))
    cognito_sub: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, native_enum=False), default=UserRole.INSPECTOR)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    organisation: Mapped[Organisation] = relationship(lazy="selectin")


class Site(Base):
    __tablename__ = "sites"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    org_id: Mapped[str] = mapped_column(ForeignKey("organisations.id"))
    name: Mapped[str] = mapped_column(String(255))
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    type: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class Inspection(Base):
    __tablename__ = "inspections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    org_id: Mapped[str] = mapped_column(ForeignKey("organisations.id"))
    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    site_name: Mapped[str] = mapped_column(String(255))
    inspection_type: Mapped[str] = mapped_column(String(64))
    inspector_name: Mapped[str] = mapped_column(String(255))
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    text_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[InspectionStatus] = mapped_column(Enum(InspectionStatus, native_enum=False), default=InspectionStatus.DRAFT)
    report: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    embedding: Mapped[list[float] | None] = mapped_column(EmbeddingVector(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    media: Mapped[list["InspectionMedia"]] = relationship(cascade="all, delete-orphan", lazy="selectin")
    issues: Mapped[list["InspectionIssue"]] = relationship(cascade="all, delete-orphan", lazy="selectin")
    transcript: Mapped["VoiceTranscript | None"] = relationship(cascade="all, delete-orphan", uselist=False, lazy="selectin")


class InspectionMedia(Base):
    __tablename__ = "inspection_media"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    inspection_id: Mapped[str] = mapped_column(ForeignKey("inspections.id"))
    type: Mapped[MediaType] = mapped_column(Enum(MediaType, native_enum=False))
    s3_key: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(128))
    size_bytes: Mapped[int] = mapped_column(Integer)
    preview_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class VoiceTranscript(Base):
    __tablename__ = "voice_transcripts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    inspection_id: Mapped[str] = mapped_column(ForeignKey("inspections.id"), unique=True)
    transcript_text: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(16), default="en-US")
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    sonic_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)


class InspectionIssue(Base):
    __tablename__ = "inspection_issues"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    inspection_id: Mapped[str] = mapped_column(ForeignKey("inspections.id"))
    title: Mapped[str] = mapped_column(String(255))
    severity: Mapped[IssueSeverity] = mapped_column(Enum(IssueSeverity, native_enum=False))
    description: Mapped[str] = mapped_column(Text)
    affected_area: Mapped[str] = mapped_column(String(255))
    suggested_action: Mapped[str] = mapped_column(Text)
    photo_reference_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class SearchQuery(Base):
    __tablename__ = "search_queries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=default_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    query_text: Mapped[str] = mapped_column(Text)
    query_embedding: Mapped[list[float] | None] = mapped_column(EmbeddingVector(1024), nullable=True)
    result_count: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
