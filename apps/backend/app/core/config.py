import json
from functools import lru_cache
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _find_env_file() -> str | None:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / ".env"
        if candidate.exists():
            return str(candidate)
    return None


def _normalize_database_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in {"postgres", "postgresql", "postgresql+asyncpg"}:
        return url

    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query.pop("channel_binding", None)
    if "sslmode" in query and "ssl" not in query:
        query["ssl"] = query.pop("sslmode")

    scheme = "postgresql+asyncpg"
    return urlunparse(parsed._replace(scheme=scheme, query=urlencode(query)))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_find_env_file(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "FieldLens API"
    environment: str = "development"
    frontend_url: str = "http://localhost:3000"
    mobile_app_url: str = "http://localhost:8081"
    cors_origins_raw: str = "http://localhost:3000,http://localhost:8081,http://localhost:19006"

    database_url: str = "sqlite+aiosqlite:///./fieldlens.db"
    auth_mode: str = "demo"
    ai_mode: str = "mock"
    storage_mode: str = "local"

    aws_region: str = "us-east-1"
    nova_lite_model_id: str = "us.amazon.nova-2-lite-v1:0"
    nova_sonic_model_id: str = "amazon.nova-2-sonic-v1:0"
    nova_embed_model_id: str = "amazon.nova-2-multimodal-embeddings-v1:0"
    nova_embed_dimensions: int = 1024
    nova_embed_document_task_type: str = "SEARCH_DOCUMENT"
    nova_embed_query_task_type: str = "SEARCH_QUERY"
    nova_embed_image_task_type: str = "GENERIC_INDEX"

    storage_bucket_region: str | None = None
    s3_bucket_name: str = ""
    s3_presign_expiry_seconds: int = 900

    jwt_secret_key: str = "fieldlens-dev-secret"
    jwt_issuer: str = "fieldlens"
    jwt_audience: str = "fieldlens-clients"
    jwt_access_token_expiry_minutes: int = 60

    seed_default_users: bool = True
    seed_users_json: str = ""
    bootstrap_org_name: str = "FieldLens Demo Org"

    frontend_url_public: str = "http://localhost:3000"
    data_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[2] / "data")
    sns_topic_arn: str = ""
    gunicorn_workers: int = 4
    run_migrations_on_startup: bool = False

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        return _normalize_database_url(value)

    @field_validator("auth_mode", "ai_mode", "storage_mode", mode="before")
    @classmethod
    def normalize_modes(cls, value: str) -> str:
        return value.lower()

    @property
    def cors_origins(self) -> list[str]:
        values = [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]
        for origin in [self.frontend_url, self.frontend_url_public, self.mobile_app_url]:
            if origin and origin not in values:
                values.append(origin)
        return values

    @property
    def is_postgres(self) -> bool:
        return self.database_url.startswith("postgresql+asyncpg://")

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "staging"}

    @property
    def bedrock_enabled(self) -> bool:
        return self.ai_mode == "bedrock"

    @property
    def s3_enabled(self) -> bool:
        return self.storage_mode == "s3"

    @property
    def jwt_enabled(self) -> bool:
        return self.auth_mode == "jwt"

    @property
    def bucket_region(self) -> str:
        return self.storage_bucket_region or self.aws_region

    @property
    def seed_users(self) -> list[dict[str, str]]:
        if self.seed_users_json:
            try:
                payload = json.loads(self.seed_users_json)
                if isinstance(payload, list):
                    return [item for item in payload if isinstance(item, dict)]
            except json.JSONDecodeError:
                return []
        return [
            {
                "email": "admin@fieldlens.local",
                "password": "FieldLensAdmin123!",
                "name": "Avery Admin",
                "role": "ADMIN",
            },
            {
                "email": "supervisor@fieldlens.local",
                "password": "FieldLensSupervisor123!",
                "name": "Sam Supervisor",
                "role": "SUPERVISOR",
            },
            {
                "email": "inspector@fieldlens.local",
                "password": "FieldLensInspector123!",
                "name": "Indigo Inspector",
                "role": "INSPECTOR",
            },
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
