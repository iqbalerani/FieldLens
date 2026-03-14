from typing import Annotated

from fastapi import Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.schemas.auth import CurrentUserResponse
from app.services.auth_service import (
    AuthenticationError,
    ensure_demo_user,
    ensure_seed_users,
    get_user_from_token,
    to_current_user,
)


def _extract_bearer_token(authorization: str | None, query_token: str | None = None) -> str | None:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1]
    return query_token


async def get_current_user_model(
    authorization: Annotated[str | None, Header()] = None,
    token: Annotated[str | None, Query()] = None,
    session: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    raw_token = _extract_bearer_token(authorization, token)

    try:
        if settings.auth_mode == "jwt":
            if not raw_token:
                raise HTTPException(status_code=401, detail="Missing bearer token")
            user = await get_user_from_token(session, raw_token)
        elif settings.auth_mode == "demo":
            await ensure_seed_users(session)
            user = await ensure_demo_user(session, raw_token or "demo-inspector")
        else:
            raise HTTPException(status_code=500, detail="Unsupported auth mode")
    except AuthenticationError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    await session.commit()
    return user


async def get_current_user(user=Depends(get_current_user_model)) -> CurrentUserResponse:
    return to_current_user(user)
