from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.auth import CurrentUserResponse, LoginRequest, LoginResponse
from app.services.auth_service import AuthenticationError, authenticate_user, create_access_token, to_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_db),
) -> LoginResponse:
    try:
        user = await authenticate_user(session, payload.email, payload.password)
    except AuthenticationError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    await session.commit()
    return LoginResponse(access_token=create_access_token(user), user=to_current_user(user))


@router.get("/me", response_model=CurrentUserResponse)
async def me(current_user: CurrentUserResponse = Depends(get_current_user)) -> CurrentUserResponse:
    return current_user
