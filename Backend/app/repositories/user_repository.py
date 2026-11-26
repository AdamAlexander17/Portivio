from datetime import datetime

from sqlalchemy import delete, select

from app.models import PasswordReset, User
from app.models.user import ROLE_ADMIN
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    def get_by_username(self, username: str) -> User | None:
        return self.db.scalar(select(User).where(User.username == username))

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email))

    def list(self) -> list[User]:
        return list(self.db.scalars(select(User).order_by(User.id)))

    def first_admin(self) -> User | None:
        """The primary account: its portfolio is the one shown at the site's root address."""
        return self.db.scalar(select(User).where(User.role == ROLE_ADMIN).order_by(User.id).limit(1))


class PasswordResetRepository(BaseRepository[PasswordReset]):
    model = PasswordReset

    def get_valid(self, token_hash: str, now: datetime) -> PasswordReset | None:
        return self.db.scalar(
            select(PasswordReset).where(PasswordReset.token_hash == token_hash, PasswordReset.expires_at > now)
        )

    def delete_for_user(self, user_id: int) -> None:
        self.db.execute(delete(PasswordReset).where(PasswordReset.user_id == user_id))
        self.db.commit()

    def delete_expired(self, now: datetime) -> None:
        self.db.execute(delete(PasswordReset).where(PasswordReset.expires_at <= now))
        self.db.commit()
