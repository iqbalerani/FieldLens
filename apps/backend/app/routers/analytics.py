from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.analytics import AnalyticsTrendPointResponse
from app.schemas.auth import CurrentUserResponse
from app.services.inspection_service import trend_points

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/trends", response_model=list[AnalyticsTrendPointResponse])
async def trends(
    session: AsyncSession = Depends(get_db),
    current_user: CurrentUserResponse = Depends(get_current_user),
) -> list[AnalyticsTrendPointResponse]:
    points = await trend_points(session, current_user.org_id)
    return [AnalyticsTrendPointResponse(**point) for point in points]

