from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models import Organisation, User, UserRole
from app.schemas.auth import CurrentUserResponse


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = get_settings()
DEMO_ORG_ID = "fieldlens-demo-org"


class AuthenticationError(Exception):
    pass


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    return pwd_context.verify(password, password_hash)


def create_access_token(user: User) -> str:
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.jwt_access_token_expiry_minutes)
    payload = {
        "sub": user.id,
        "org_id": user.org_id,
        "role": user.role.value,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=["HS256"],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
        )
    except JWTError as exc:  # pragma: no cover - exercised by API tests
        raise AuthenticationError("Invalid access token") from exc


async def ensure_seed_users(session: AsyncSession) -> None:
    if not settings.seed_default_users:
        return

    organisation = await session.get(Organisation, DEMO_ORG_ID)
    if organisation is None:
        organisation = Organisation(id=DEMO_ORG_ID, name=settings.bootstrap_org_name, industry_type="construction")
        session.add(organisation)
        await session.flush()

    for item in settings.seed_users:
        email = item.get("email")
        password = item.get("password")
        if not email or not password:
            continue
        user = (
            await session.execute(select(User).where(User.email == email))
        ).scalar_one_or_none()
        if user is None:
            user = User(
                org_id=DEMO_ORG_ID,
                name=item.get("name", email.split("@", 1)[0]),
                email=email,
                role=UserRole(item.get("role", UserRole.INSPECTOR.value)),
                password_hash=hash_password(password),
                is_active=True,
            )
            session.add(user)
        elif not user.password_hash:
            user.password_hash = hash_password(password)
        user.is_active = True
    await session.flush()


async def authenticate_user(session: AsyncSession, email: str, password: str) -> User:
    await ensure_seed_users(session)
    user = (
        await session.execute(select(User).where(User.email == email))
    ).scalar_one_or_none()
    if user is None or not user.is_active or not verify_password(password, user.password_hash):
        raise AuthenticationError("Invalid email or password")
    return user


async def get_user_from_token(session: AsyncSession, token: str) -> User:
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Token missing subject")

    user = await session.get(User, user_id)
    if user is None or not user.is_active:
        raise AuthenticationError("User not found")
    return user


async def ensure_demo_user(session: AsyncSession, token: str) -> User:
    await ensure_seed_users(session)
    fallback = {
        "demo-admin": "admin@fieldlens.local",
        "demo-supervisor": "supervisor@fieldlens.local",
        "demo-inspector": "inspector@fieldlens.local",
    }
    email = fallback.get(token, fallback["demo-inspector"])
    user = (
        await session.execute(select(User).where(User.email == email))
    ).scalar_one_or_none()
    if user is None:
        raise AuthenticationError("Demo user seed missing")
    return user


def to_current_user(user: User) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user.id,
        org_id=user.org_id,
        email=user.email,
        name=user.name,
        role=user.role,
    )
