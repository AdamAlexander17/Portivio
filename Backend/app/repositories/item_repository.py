from sqlalchemy import delete, select

from app.models import ContentItem
from app.repositories.base import BaseRepository


class ItemRepository(BaseRepository[ContentItem]):
    model = ContentItem

    def list(self, user_id: int, section: str | None = None) -> list[ContentItem]:
        query = (
            select(ContentItem)
            .where(ContentItem.user_id == user_id)
            .order_by(ContentItem.section, ContentItem.sort_order, ContentItem.id)
        )
        if section:
            query = query.where(ContentItem.section == section)
        return list(self.db.scalars(query))

    def delete_section(self, user_id: int, section: str) -> None:
        self.db.execute(delete(ContentItem).where(ContentItem.user_id == user_id, ContentItem.section == section))
        self.db.commit()

    def delete_for_user(self, user_id: int) -> None:
        self.db.execute(delete(ContentItem).where(ContentItem.user_id == user_id))
        self.db.commit()
