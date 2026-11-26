from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

ROLE_ADMIN = "admin"
ROLE_USER = "user"


class User(Base):
    """An account that can sign in. Every account owns one portfolio site.

    An admin can also create, block and delete other accounts and manage their sites.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(60), unique=True)
    # Needed for password reset. Accounts made before email existed may have none.
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    # Google's own id of the person, once they have signed in with Google.
    google_sub: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    # Facebook's own id of the person, once they have signed in with Facebook.
    facebook_id: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    role: Mapped[str] = mapped_column(String(20), default=ROLE_USER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Stored inside every sign-in token. Raising it (on a password change) ends all older sessions.
    token_version: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    @property
    def is_admin(self) -> bool:
        return self.role == ROLE_ADMIN


class PasswordReset(Base):
    """A one-time "forgot password" link. Only a hash of the token is stored."""

    __tablename__ = "password_resets"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
