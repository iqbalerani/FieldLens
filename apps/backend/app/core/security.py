from typing import Annotated

from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.schemas.auth import CurrentUserResponse
from app.services.auth_service import ensure_demo_user, to_current_user


async def get_current_user_model(
    authorization: Annotated[str | None, Header()] = None,
    session: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    if settings.auth_mode != "demo":
        raise HTTPException(status_code=501, detail="Cognito mode is not wired in this scaffold yet")
    token = "demo-inspector"
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
    user = await ensure_demo_user(session, token)
    await session.commit()
    return user


async def get_current_user(user=Depends(get_current_user_model)) -> CurrentUserResponse:
    return to_current_user(user)
