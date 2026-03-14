import math

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models import Inspection
from app.services.ai_service import ai_service


settings = get_settings()


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right:
        return 0.0
    length = min(len(left), len(right))
    numerator = sum(left[index] * right[index] for index in range(length))
    left_norm = math.sqrt(sum(value * value for value in left[:length])) or 1.0
    right_norm = math.sqrt(sum(value * value for value in right[:length])) or 1.0
    return numerator / (left_norm * right_norm)


async def _find_with_pgvector(
    session: AsyncSession,
    *,
    org_id: str,
    query_embedding: list[float],
    exclude_inspection_id: str | None,
    limit: int,
) -> list[tuple[Inspection, float]]:
    distance = Inspection.embedding.cosine_distance(query_embedding)
    stmt = (
        select(Inspection, (1 - distance).label("score"))
        .where(Inspection.org_id == org_id)
        .where(Inspection.embedding.is_not(None))
        .order_by(distance)
        .limit(limit)
    )
    if exclude_inspection_id:
        stmt = stmt.where(Inspection.id != exclude_inspection_id)

    rows = (await session.execute(stmt)).all()
    return [(inspection, float(score or 0.0)) for inspection, score in rows]


async def _find_with_python(
    session: AsyncSession,
    *,
    org_id: str,
    query_embedding: list[float],
    exclude_inspection_id: str | None,
    limit: int,
) -> list[tuple[Inspection, float]]:
    inspections = (
        await session.execute(
            select(Inspection).where(Inspection.org_id == org_id).where(Inspection.embedding.is_not(None))
        )
    ).scalars().all()

    ranked: list[tuple[Inspection, float]] = []
    for inspection in inspections:
        if exclude_inspection_id and inspection.id == exclude_inspection_id:
            continue
        score = cosine_similarity(query_embedding, inspection.embedding or [])
        ranked.append((inspection, score))
    ranked.sort(key=lambda item: item[1], reverse=True)
    return ranked[:limit]


async def find_similar_inspections(
    session: AsyncSession,
    org_id: str,
    query: str,
    exclude_inspection_id: str | None = None,
    limit: int = 10,
) -> list[tuple[Inspection, float]]:
    query_embedding = ai_service.embed_text(query, query=True)
    if settings.is_postgres:
        return await _find_with_pgvector(
            session,
            org_id=org_id,
            query_embedding=query_embedding,
            exclude_inspection_id=exclude_inspection_id,
            limit=limit,
        )
    return await _find_with_python(
        session,
        org_id=org_id,
        query_embedding=query_embedding,
        exclude_inspection_id=exclude_inspection_id,
        limit=limit,
    )
