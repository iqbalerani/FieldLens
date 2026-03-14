import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config as AlembicConfig
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError, ProgrammingError

from app.core.config import get_settings
from app.core.database import SessionLocal, check_database_health
from app.routers import analytics, auth, inspections, reports, search, stream, voice
from app.services.ai_service import ai_service
from app.services.auth_service import ensure_seed_users
from app.services.storage_service import storage_service


SCHEMA_NOT_INITIALIZED_MESSAGE = (
    "Database schema is not initialized; run Alembic or set RUN_MIGRATIONS_ON_STARTUP=true"
)


def validate_runtime_contract(settings) -> None:
    if not settings.is_production:
        return

    violations: list[str] = []
    if settings.ai_mode != "bedrock":
        violations.append("AI_MODE must be 'bedrock' in staging/production")
    if settings.storage_mode != "s3":
        violations.append("STORAGE_MODE must be 's3' in staging/production")
    if settings.auth_mode != "jwt":
        violations.append("AUTH_MODE must be 'jwt' in staging/production")
    if not settings.is_postgres:
        violations.append("DATABASE_URL must use PostgreSQL + asyncpg in staging/production")
    if not settings.s3_bucket_name:
        violations.append("S3_BUCKET_NAME is required in staging/production")
    if settings.jwt_secret_key == "fieldlens-dev-secret":
        violations.append("JWT_SECRET_KEY must be overridden in staging/production")

    if violations:
        raise RuntimeError("; ".join(violations))


async def maybe_run_migrations(settings) -> None:
    if not settings.run_migrations_on_startup:
        return

    backend_root = Path(__file__).resolve().parents[1]
    alembic_cfg = AlembicConfig(str(backend_root / "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)
    alembic_cfg.set_main_option("script_location", str(backend_root / "alembic"))
    alembic_cfg.set_main_option("prepend_sys_path", str(backend_root))
    await asyncio.to_thread(command.upgrade, alembic_cfg, "head")


def is_missing_schema_error(exc: Exception) -> bool:
    if not isinstance(exc, (OperationalError, ProgrammingError)):
        return False

    message = str(exc).lower()
    if "organisations" not in message:
        return False

    missing_table_markers = (
        "no such table",
        "relation",
        "does not exist",
        "undefinedtable",
    )
    return any(marker in message for marker in missing_table_markers)


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    validate_runtime_contract(settings)
    await maybe_run_migrations(settings)

    try:
        async with SessionLocal() as session:
            await ensure_seed_users(session)
            await session.commit()
    except Exception as exc:
        if is_missing_schema_error(exc):
            raise RuntimeError(SCHEMA_NOT_INITIALIZED_MESSAGE) from exc
        raise

    yield


settings = get_settings()
app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, object]:
    dependencies: dict[str, str] = {}
    status = "ok"

    try:
        await check_database_health()
        dependencies["database"] = "ok"
    except Exception as exc:  # pragma: no cover - depends on runtime env
        dependencies["database"] = f"error: {exc}"
        status = "degraded"

    try:
        storage_service.check_health()
        dependencies["storage"] = "ok"
    except Exception as exc:  # pragma: no cover - depends on runtime env
        dependencies["storage"] = f"error: {exc}"
        status = "degraded"

    try:
        ai_service.check_health()
        dependencies["bedrock"] = "ok" if settings.bedrock_enabled else "disabled"
    except Exception as exc:  # pragma: no cover - depends on runtime env
        dependencies["bedrock"] = f"error: {exc}"
        status = "degraded"

    return {
        "status": status,
        "environment": settings.environment,
        "dependencies": dependencies,
    }


app.include_router(auth.router)
app.include_router(inspections.router)
app.include_router(reports.router)
app.include_router(search.router)
app.include_router(analytics.router)
app.include_router(stream.router)
app.include_router(voice.router)
