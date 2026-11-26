from sqlalchemy import delete, select

from app.models import Message
from app.repositories.base import BaseRepository


class MessageRepository(BaseRepository[Message]):
    model = Message

    def list(self, user_id: int) -> list[Message]:
        return list(
            self.db.scalars(
                select(Message).where(Message.user_id == user_id).order_by(Message.created_at.desc(), Message.id.desc())
            )
        )

    def delete_for_user(self, user_id: int) -> None:
        self.db.execute(delete(Message).where(Message.user_id == user_id))
        self.db.commit()
