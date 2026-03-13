import math

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Inspection
from app.services.ai_service import ai_service


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right:
        return 0.0
    length = min(len(left), len(right))
    numerator = sum(left[index] * right[index] for index in range(length))
    left_norm = math.sqrt(sum(value * value for value in left[:length])) or 1.0
    right_norm = math.sqrt(sum(value * value for value in right[:length])) or 1.0
    return numerator / (left_norm * right_norm)


async def find_similar_inspections(
    session: AsyncSession,
    org_id: str,
    query: str,
    exclude_inspection_id: str | None = None,
    limit: int = 10,
) -> list[tuple[Inspection, float]]:
    query_embedding = ai_service.embed_text(query)
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

