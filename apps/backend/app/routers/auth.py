from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.schemas.auth import CurrentUserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=CurrentUserResponse)
async def me(current_user: CurrentUserResponse = Depends(get_current_user)) -> CurrentUserResponse:
    return current_user

