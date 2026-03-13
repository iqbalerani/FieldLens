import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.core.events import broker
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.auth import CurrentUserResponse
from app.services.auth_service import ensure_demo_user, to_current_user
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(tags=["stream"])


async def sse_payload(org_id: str) -> AsyncIterator[str]:
    async for event in broker.subscribe(org_id):
        yield f"event: {event['type']}\n"
        yield f"data: {json.dumps(event)}\n\n"


@router.get("/stream/inspections/{org_id}")
async def stream_inspections(
    org_id: str,
    token: str | None = Query(default=None),
    current_user: CurrentUserResponse = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    if token:
        current_user = to_current_user(await ensure_demo_user(session, token))
    if current_user.org_id != org_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return StreamingResponse(sse_payload(org_id), media_type="text/event-stream")
