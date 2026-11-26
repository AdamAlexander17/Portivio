"""Generic database access shared by every repository."""
from typing import Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, db: Session):
        self.db = db

    def get(self, obj_id: int) -> ModelT | None:
        return self.db.get(self.model, obj_id)

    def count(self, *conditions) -> int:
        return self.db.scalar(select(func.count()).select_from(self.model).where(*conditions)) or 0

    def save(self, obj: ModelT) -> ModelT:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, obj: ModelT) -> None:
        self.db.delete(obj)
        self.db.commit()

    def next_sort_order(self, *conditions) -> int:
        current = self.db.scalar(select(func.max(self.model.sort_order)).where(*conditions))
        return (current or 0) + 1

    def reorder(self, ids: list[int], *conditions) -> None:
        """Set sort_order to match the position of each id in `ids`."""
        rows = self.db.scalars(select(self.model).where(self.model.id.in_(ids), *conditions)).all()
        by_id = {row.id: row for row in rows}
        for position, obj_id in enumerate(ids, start=1):
            if obj_id in by_id:
                by_id[obj_id].sort_order = position
        self.db.commit()
