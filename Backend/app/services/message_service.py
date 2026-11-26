from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Message, Project
from app.repositories.message_repository import MessageRepository
from app.repositories.project_repository import ProjectRepository
from app.schemas.message import MessageCreate


class MessageService:
    """Contact form messages sent to one user's site."""

    def __init__(self, db: Session, user_id: int):
        self.user_id = user_id
        self.messages = MessageRepository(db)
        self.projects = ProjectRepository(db)

    def create(self, data: MessageCreate) -> None:
        if data.website:  # honeypot filled in: a bot, so drop it quietly
            return
        self.messages.save(Message(**data.model_dump(exclude={"website"}), user_id=self.user_id))

    def list(self) -> list[Message]:
        return self.messages.list(self.user_id)

    def _get(self, message_id: int) -> Message:
        message = self.messages.get(message_id)
        if not message or message.user_id != self.user_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Message not found.")
        return message

    def set_read(self, message_id: int, is_read: bool) -> Message:
        message = self._get(message_id)
        message.is_read = is_read
        return self.messages.save(message)

    def delete(self, message_id: int) -> None:
        self.messages.delete(self._get(message_id))

    def delete_everything(self) -> None:
        self.messages.delete_for_user(self.user_id)

    def stats(self) -> dict[str, int]:
        mine_p = Project.user_id == self.user_id
        mine_m = Message.user_id == self.user_id
        return {
            "projects": self.projects.count(mine_p),
            "published_projects": self.projects.count(mine_p, Project.is_published.is_(True)),
            "messages": self.messages.count(mine_m),
            "unread_messages": self.messages.count(mine_m, Message.is_read.is_(False)),
        }
