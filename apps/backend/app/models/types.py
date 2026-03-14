from sqlalchemy import JSON
from sqlalchemy.types import TypeDecorator

try:
    from pgvector.sqlalchemy import Vector as PGVector
except ImportError:  # pragma: no cover - exercised only when optional deps are missing
    PGVector = None


class EmbeddingVector(TypeDecorator):
    impl = JSON
    cache_ok = True
    comparator_factory = PGVector.comparator_factory if PGVector is not None else JSON.comparator_factory

    def __init__(self, dimensions: int) -> None:
        super().__init__()
        self.dimensions = dimensions

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql" and PGVector is not None:
            return dialect.type_descriptor(PGVector(self.dimensions))
        return dialect.type_descriptor(JSON())
