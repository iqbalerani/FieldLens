"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-13

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "organisations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("industry_type", sa.String(128), nullable=True),
        sa.Column("settings", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("org_id", sa.String(36), sa.ForeignKey("organisations.id"), nullable=False),
        sa.Column("cognito_sub", sa.String(255), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("role", sa.String(32), nullable=False, server_default="INSPECTOR"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "sites",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("org_id", sa.String(36), sa.ForeignKey("organisations.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address", sa.String(255), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("type", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "inspections",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("org_id", sa.String(36), sa.ForeignKey("organisations.id"), nullable=False),
        sa.Column("site_id", sa.String(36), sa.ForeignKey("sites.id"), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("site_name", sa.String(255), nullable=False),
        sa.Column("inspection_type", sa.String(64), nullable=False),
        sa.Column("inspector_name", sa.String(255), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("text_notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="draft"),
        sa.Column("report", sa.JSON(), nullable=True),
        sa.Column("embedding", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "inspection_media",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("inspection_id", sa.String(36), sa.ForeignKey("inspections.id"), nullable=False),
        sa.Column("type", sa.String(16), nullable=False),
        sa.Column("s3_key", sa.String(255), nullable=False),
        sa.Column("mime_type", sa.String(128), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("preview_url", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "voice_transcripts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("inspection_id", sa.String(36), sa.ForeignKey("inspections.id"), nullable=False, unique=True),
        sa.Column("transcript_text", sa.Text(), nullable=False),
        sa.Column("language", sa.String(16), nullable=False, server_default="en-US"),
        sa.Column("word_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sonic_session_id", sa.String(255), nullable=True),
    )

    op.create_table(
        "inspection_issues",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("inspection_id", sa.String(36), sa.ForeignKey("inspections.id"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("severity", sa.String(16), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("affected_area", sa.String(255), nullable=False),
        sa.Column("suggested_action", sa.Text(), nullable=False),
        sa.Column("photo_reference_index", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "search_queries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("query_text", sa.Text(), nullable=False),
        sa.Column("query_embedding", sa.JSON(), nullable=True),
        sa.Column("result_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("search_queries")
    op.drop_table("inspection_issues")
    op.drop_table("voice_transcripts")
    op.drop_table("inspection_media")
    op.drop_table("inspections")
    op.drop_table("sites")
    op.drop_table("users")
    op.drop_table("organisations")
