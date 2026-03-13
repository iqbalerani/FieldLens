import asyncio
from collections import defaultdict
from collections.abc import AsyncIterator
from typing import Any


class EventBroker:
    def __init__(self) -> None:
        self._queues: dict[str, set[asyncio.Queue[dict[str, Any]]]] = defaultdict(set)

    async def publish(self, org_id: str, event: dict[str, Any]) -> None:
        for queue in list(self._queues[org_id]):
            await queue.put(event)

    async def subscribe(self, org_id: str) -> AsyncIterator[dict[str, Any]]:
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
        self._queues[org_id].add(queue)
        try:
            while True:
                yield await queue.get()
        finally:
            self._queues[org_id].discard(queue)


broker = EventBroker()
