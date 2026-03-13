from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_model
from app.routers.inspections import serialize_summary
from app.schemas.auth import CurrentUserResponse
from app.schemas.search import SearchRequest, SearchResultResponse
from app.services.inspection_service import log_search
from app.services.search_service import find_similar_inspections

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=list[SearchResultResponse])
async def search(
    payload: SearchRequest,
    session: AsyncSession = Depends(get_db),
    current_user: CurrentUserResponse = Depends(get_current_user),
    current_user_model=Depends(get_current_user_model),
) -> list[SearchResultResponse]:
    matches = await find_similar_inspections(session, current_user.org_id, payload.query)
    await log_search(session, current_user_model.id, payload.query, len(matches))
    await session.commit()
    return [
        SearchResultResponse(inspection=serialize_summary(inspection), similarityScore=round(score, 4))
        for inspection, score in matches
    ]
