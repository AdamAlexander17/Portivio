"""Dependencies shared by the routes."""
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import User
from app.repositories.user_repository import UserRepository

DbSession = Annotated[Session, Depends(get_db)]

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User:
    """The signed-in account. Blocked accounts are rejected even with a valid token."""
    decoded = decode_access_token(credentials.credentials) if credentials else None
    user = UserRepository(db).get_by_username(decoded[0]) if decoded else None
    # A token from before the last password change carries an older version and is refused.
    if not user or not user.is_active or decoded[1] != user.token_version:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_admin(user: CurrentUser) -> User:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only an admin can do this.")
    return user


CurrentAdmin = Annotated[User, Depends(require_admin)]


def get_owner(
    db: DbSession,
    user: CurrentUser,
    x_manage_user: Annotated[int | None, Header()] = None,
) -> User:
    """Whose portfolio the panel request works on.

    Normally the signed-in user's own. An admin can send the `X-Manage-User`
    header with another account's id to manage that account's portfolio.
    """
    if x_manage_user is None or x_manage_user == user.id:
        return user
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only an admin can manage another user's site.")
    target = UserRepository(db).get(x_manage_user)
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
    return target


Owner = Annotated[User, Depends(get_owner)]


def get_public_owner(db: DbSession, user: str | None = None) -> User:
    """Whose portfolio a visitor is looking at: `?user=<username>`, or the primary site."""
    users = UserRepository(db)
    owner = users.get_by_username(user.strip().lower()) if user else users.first_admin()
    if not owner or not owner.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This portfolio does not exist.")
    return owner


PublicOwner = Annotated[User, Depends(get_public_owner)]
