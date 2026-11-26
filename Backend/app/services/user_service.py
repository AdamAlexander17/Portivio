"""Account management. Only an admin reaches this service."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.defaults import new_user_texts
from app.core.security import hash_password
from app.models import Profile, User
from app.models.user import ROLE_USER
from app.repositories.profile_repository import ProfileRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate
from app.services.analytics_service import AnalyticsService
from app.services.message_service import MessageService
from app.services.project_service import ProjectService
from app.services.site_service import SiteService


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.profiles = ProfileRepository(db)

    def _row(self, user: User, name: str) -> dict:
        return {
            "id": user.id, "username": user.username, "email": user.email, "role": user.role,
            "is_active": user.is_active, "created_at": user.created_at, "name": name,
        }

    def list(self) -> list[dict]:
        names = self.profiles.names_by_user()
        return [self._row(user, names.get(user.id, "")) for user in self.users.list()]

    def get(self, user_id: int) -> User:
        user = self.users.get(user_id)
        if not user:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
        return user

    def create_account(
        self, username: str, full_name: str, password: str, email: str | None = None, profession: str = "other"
    ) -> User:
        """A new normal account with its own empty portfolio. Used by admins and by sign up."""
        if self.users.get_by_username(username):
            raise HTTPException(status.HTTP_409_CONFLICT, "This username is already taken.")
        if email and self.users.get_by_email(email):
            raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")
        user = self.users.save(
            User(username=username, email=email or None, password_hash=hash_password(password), role=ROLE_USER)
        )
        self.profiles.save(Profile(user_id=user.id, name=full_name, texts=new_user_texts(full_name)))
        # Start the site with content that suits the owner's kind of work.
        SiteService(self.db, user.id).apply_starter(profession)
        return user

    def create(self, data: UserCreate) -> dict:
        user = self.create_account(data.username, data.full_name, data.password, data.email, data.profession)
        return self._row(user, data.full_name)

    def update(self, user_id: int, data: UserUpdate, acting_admin: User) -> dict:
        user = self.get(user_id)
        if data.is_active is not None and data.is_active != user.is_active:
            if user.id == acting_admin.id:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot block your own account.")
            user.is_active = data.is_active
        if data.password:
            user.password_hash = hash_password(data.password)
            user.token_version += 1  # the user's existing sessions stop working
        self.users.save(user)
        profile = self.profiles.for_user(user.id)
        return self._row(user, profile.name if profile else "")

    def delete(self, user_id: int, acting_admin: User) -> None:
        user = self.get(user_id)
        if user.id == acting_admin.id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot delete your own account.")
        if user.is_admin:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "An admin account cannot be deleted.")
        # Remove the user's whole portfolio, including uploaded files, then the account.
        ProjectService(self.db, user.id).delete_everything()
        MessageService(self.db, user.id).delete_everything()
        AnalyticsService(self.db, user.id).delete_everything()
        SiteService(self.db, user.id).delete_everything()
        self.users.delete(user)
