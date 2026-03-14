import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.core.database import get_db
from app.core.events import broker
from app.core.security import get_current_user
from app.schemas.auth import CurrentUserResponse
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(tags=["stream"])


async def sse_payload(org_id: str, *, once: bool = False) -> AsyncIterator[str]:
    connected_event = {"type": "connected", "orgId": org_id}
    yield "event: connected\n"
    yield f"data: {json.dumps(connected_event)}\n\n"
    if once:
        return
    async for event in broker.subscribe(org_id):
        yield f"event: {event['type']}\n"
        yield f"data: {json.dumps(event)}\n\n"


@router.get("/stream/inspections/{org_id}")
async def stream_inspections(
    org_id: str,
    token: str | None = Query(default=None),
    once: bool = Query(default=False),
    current_user: CurrentUserResponse = Depends(get_current_user),
    _session: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    if current_user.org_id != org_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return StreamingResponse(sse_payload(org_id, once=once), media_type="text/event-stream")
