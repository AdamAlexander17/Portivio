from fastapi import APIRouter, status

from app.api.deps import DbSession, Owner
from app.schemas.message import MessageOut, MessageRead, Stats
from app.services.message_service import MessageService

router = APIRouter(tags=["panel: messages"])


@router.get("/stats", response_model=Stats)
def stats(owner: Owner, db: DbSession):
    return MessageService(db, owner.id).stats()


@router.get("/messages", response_model=list[MessageOut])
def list_messages(owner: Owner, db: DbSession):
    return MessageService(db, owner.id).list()


@router.patch("/messages/{message_id}", response_model=MessageOut)
def mark_message(message_id: int, data: MessageRead, owner: Owner, db: DbSession):
    return MessageService(db, owner.id).set_read(message_id, data.is_read)


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(message_id: int, owner: Owner, db: DbSession):
    MessageService(db, owner.id).delete(message_id)
