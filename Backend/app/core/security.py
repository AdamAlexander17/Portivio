"""Password hashing, sign-in tokens and one-time tokens."""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        return False


# Checked when the username does not exist, so a wrong username takes as long
# to reject as a wrong password and cannot be told apart by timing.
DUMMY_PASSWORD_HASH = hash_password(secrets.token_urlsafe(16))


def create_access_token(subject: str, version: int = 0) -> str:
    """A signed token naming the user. `version` ties it to the user's current password."""
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": subject, "ver": version, "exp": expires}, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> tuple[str, int] | None:
    """Return (username, token version), or None if the token is invalid or expired."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
    username = payload.get("sub")
    if not isinstance(username, str):
        return None
    return username, int(payload.get("ver") or 0)


def new_one_time_token() -> tuple[str, str]:
    """A random token for an emailed link, and the hash to keep in the database.

    Only the hash is stored, so someone who reads the database cannot use the links.
    """
    token = secrets.token_urlsafe(32)
    return token, hash_one_time_token(token)


def hash_one_time_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def utcnow() -> datetime:
    """Current UTC time without timezone info, matching what the database stores."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
