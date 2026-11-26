"""Signing in, signing up and passwords."""
import re
import secrets
from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.facebook import verify_facebook_token
from app.core.google import verify_google_credential
from app.core.security import (
    DUMMY_PASSWORD_HASH, create_access_token, hash_one_time_token, hash_password,
    new_one_time_token, utcnow, verify_password,
)
from app.models import PasswordReset, User
from app.models.user import ROLE_ADMIN
from app.repositories.user_repository import PasswordResetRepository, UserRepository
from app.schemas.auth import RegisterRequest
from app.services.email_service import send_email

# Names that would clash with addresses of the site itself or pass for staff.
RESERVED_USERNAMES = {
    "admin", "administrator", "root", "support", "help", "staff", "api", "u", "uploads",
    "login", "signup", "register", "www", "mail", "static", "assets", "about", "contact",
    "projects", "services",
}


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.resets = PasswordResetRepository(db)

    def token_for(self, user: User) -> str:
        return create_access_token(user.username, user.token_version)

    def ensure_first_admin(self) -> User | None:
        """Create the admin account from .env the first time the app starts."""
        admin = self.users.first_admin()
        if not admin and settings.ADMIN_PASSWORD:
            admin = self.users.save(
                User(
                    username=settings.ADMIN_USERNAME.strip().lower(),
                    password_hash=hash_password(settings.ADMIN_PASSWORD),
                    role=ROLE_ADMIN,
                )
            )
        return admin

    # ---- sign in / sign up ---------------------------------------------
    def login(self, identifier: str, password: str) -> User:
        """Sign in with a username or an email address."""
        identifier = identifier.strip().lower()
        user = self.users.get_by_email(identifier) if "@" in identifier else self.users.get_by_username(identifier)
        # Always run one password check, so an unknown name is not answered faster than a wrong password.
        valid = verify_password(password, user.password_hash if user else DUMMY_PASSWORD_HASH)
        if not user or not valid:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong username or password.")
        if not user.is_active:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been blocked. Contact the admin.")
        return user

    def register(self, data: RegisterRequest) -> User:
        if not settings.ALLOW_SIGNUP:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Sign up is closed. Ask the admin for an account.")
        if data.username in RESERVED_USERNAMES:
            raise HTTPException(status.HTTP_409_CONFLICT, "This username is not available.")
        # Imported here: user_service imports the services that build a new account's site.
        from app.services.user_service import UserService

        return UserService(self.db).create_account(
            data.username, data.full_name, data.password, data.email, data.profession
        )

    def google_sign_in(self, credential: str) -> tuple[User, bool]:
        """Sign in with a Google credential. Returns the account and whether it was just created."""
        claims = verify_google_credential(credential)
        return self._social_sign_in(User.google_sub, str(claims["sub"]), claims["email"], str(claims.get("name") or ""))

    def facebook_sign_in(self, access_token: str) -> tuple[User, bool]:
        """Sign in with a Facebook access token. Returns the account and whether it was just created."""
        person = verify_facebook_token(access_token)
        return self._social_sign_in(User.facebook_id, person["id"], person["email"], person["name"])

    def _social_sign_in(self, id_column, provider_id: str, email: str, name: str) -> tuple[User, bool]:
        """Find or make the account of someone a provider (Google, Facebook) has identified.

        `id_column` is where that provider's id of the person is kept on the account.
        """
        email = email.strip().lower()
        created = False
        user = self.db.scalar(select(User).where(id_column == provider_id))
        if not user:
            user = self.users.get_by_email(email)
            if user:
                first_link = not (user.google_sub or user.facebook_id)
                setattr(user, id_column.key, provider_id)
                if first_link:
                    # An account made with a password. Emails are not verified at sign up, so someone
                    # else could have made it with this address: the old password and every open
                    # session stop working. Its owner signs in with the provider from now on
                    # (or sets a new password with "Forgot password").
                    user.password_hash = hash_password(secrets.token_urlsafe(32))
                    user.token_version += 1
                    self.resets.delete_for_user(user.id)
                self.users.save(user)
            else:
                if not settings.ALLOW_SIGNUP:
                    raise HTTPException(status.HTTP_403_FORBIDDEN, "Sign up is closed. Ask the admin for an account.")
                from app.services.user_service import UserService

                user = UserService(self.db).create_account(
                    self._free_username(email), name.strip()[:120] or email.split("@")[0], secrets.token_urlsafe(32), email
                )
                setattr(user, id_column.key, provider_id)
                self.users.save(user)
                created = True
        if not user.is_active:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been blocked. Contact the admin.")
        return user, created

    def _free_username(self, email: str) -> str:
        """A username nobody has yet, made from the part of the email before the @."""
        base = re.sub(r"[^a-z0-9_-]", "", email.split("@")[0].lower()).lstrip("_-")[:24]
        if len(base) < 3:
            base = "user"
        name = base
        while name in RESERVED_USERNAMES or self.users.get_by_username(name):
            name = f"{base}{secrets.randbelow(9000) + 1000}"
        return name

    # ---- passwords -----------------------------------------------------
    def change_password(self, user: User, current_password: str, new_password: str) -> None:
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is wrong.")
        self._set_password(user, new_password)

    def _set_password(self, user: User, new_password: str) -> None:
        user.password_hash = hash_password(new_password)
        user.token_version += 1  # signs out every device that was using the old password
        self.users.save(user)
        self.resets.delete_for_user(user.id)

    def request_password_reset(self, email: str) -> None:
        """Email a reset link if the address belongs to an active account.

        The caller answers the same way whether or not the address is known,
        so this cannot be used to find out who has an account.
        """
        user = self.users.get_by_email(email)
        if not user or not user.is_active:
            return
        now = utcnow()
        self.resets.delete_expired(now)
        self.resets.delete_for_user(user.id)  # only the newest link works
        token, token_hash = new_one_time_token()
        self.resets.save(
            PasswordReset(
                user_id=user.id, token_hash=token_hash,
                expires_at=now + timedelta(minutes=settings.RESET_TOKEN_MINUTES),
            )
        )
        link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"
        send_email(
            user.email,
            "Reset your password",
            f"Hello {user.username},\n\nUse this link to choose a new password. It works once and expires in "
            f"{settings.RESET_TOKEN_MINUTES} minutes.\n\n{link}\n\nIf you did not ask for this, you can ignore this email.",
        )

    def reset_password(self, token: str, new_password: str) -> None:
        reset = self.resets.get_valid(hash_one_time_token(token), utcnow())
        user = self.users.get(reset.user_id) if reset else None
        if not user or not user.is_active:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "This reset link is invalid or has expired. Ask for a new one.")
        self._set_password(user, new_password)  # also deletes the link, so it works only once

    def set_email(self, user: User, email: str) -> User:
        other = self.users.get_by_email(email)
        if other and other.id != user.id:
            raise HTTPException(status.HTTP_409_CONFLICT, "This email is already used by another account.")
        user.email = email
        return self.users.save(user)
