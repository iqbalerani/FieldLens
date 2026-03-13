from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[4] / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "FieldLens API"
    environment: str = "development"
    database_url: str = "sqlite+aiosqlite:///./fieldlens.db"
    aws_region: str = "us-east-1"
    nova_lite_model_id: str = "amazon.nova-lite-v2:0"
    nova_sonic_model_id: str = "amazon.nova-sonic-v2:0"
    nova_embed_model_id: str = "amazon.nova-embed-multimodal-v1:0"
    auth_mode: str = "demo"
    ai_mode: str = "mock"
    storage_mode: str = "local"
    s3_bucket_name: str = "fieldlens-media-dev"
    frontend_url: str = "http://localhost:3000"
    data_dir: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[2] / "data")
    sns_topic_arn: str = ""
    gunicorn_workers: int = 4


@lru_cache
def get_settings() -> Settings:
    return Settings()

