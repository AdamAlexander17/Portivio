from fastapi import APIRouter, status

from app.api.deps import DbSession, Owner
from app.schemas.common import Reorder
from app.schemas.content_item import ItemCreate, ItemOut, ItemUpdate, Section
from app.services.item_service import ItemService

router = APIRouter(prefix="/items", tags=["panel: page sections"])


@router.get("", response_model=list[ItemOut])
def list_items(section: Section, owner: Owner, db: DbSession):
    return ItemService(db, owner.id).list(section)


@router.post("", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
def create_item(data: ItemCreate, owner: Owner, db: DbSession):
    return ItemService(db, owner.id).create(data)


@router.put("/reorder/{section}", response_model=list[ItemOut])
def reorder_items(section: Section, data: Reorder, owner: Owner, db: DbSession):
    return ItemService(db, owner.id).reorder(section, data.ids)


@router.put("/{item_id}", response_model=ItemOut)
def update_item(item_id: int, data: ItemUpdate, owner: Owner, db: DbSession):
    return ItemService(db, owner.id).update(item_id, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, owner: Owner, db: DbSession):
    ItemService(db, owner.id).delete(item_id)
