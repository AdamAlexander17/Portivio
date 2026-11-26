from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import ContentItem
from app.repositories.item_repository import ItemRepository
from app.schemas.content_item import ItemCreate, ItemUpdate


class ItemService:
    """List entries (services, FAQ, experience and so on) belonging to one user."""

    def __init__(self, db: Session, user_id: int):
        self.user_id = user_id
        self.items = ItemRepository(db)

    def list(self, section: str | None = None) -> list[ContentItem]:
        return self.items.list(self.user_id, section)

    def get(self, item_id: int) -> ContentItem:
        item = self.items.get(item_id)
        if not item or item.user_id != self.user_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found.")
        return item

    def create(self, data: ItemCreate) -> ContentItem:
        order = self.items.next_sort_order(ContentItem.user_id == self.user_id, ContentItem.section == data.section)
        return self.items.save(ContentItem(**data.model_dump(), user_id=self.user_id, sort_order=order))

    def update(self, item_id: int, data: ItemUpdate) -> ContentItem:
        item = self.get(item_id)
        for field, value in data.model_dump().items():
            setattr(item, field, value)
        return self.items.save(item)

    def delete(self, item_id: int) -> None:
        self.items.delete(self.get(item_id))

    def reorder(self, section: str, ids: list[int]) -> list[ContentItem]:
        self.items.reorder(ids, ContentItem.user_id == self.user_id, ContentItem.section == section)
        return self.items.list(self.user_id, section)
