from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, EmailStr, Field


def _username(value: str) -> str:
    return value.strip().lower()


def _email(value: str) -> str:
    return value.strip().lower()


# Lowercase letters, numbers, hyphen and underscore: it becomes part of the site link (/u/<username>).
Username = Annotated[str, AfterValidator(_username), Field(pattern=r"^\s*[A-Za-z0-9][A-Za-z0-9_-]{2,29}\s*$")]
# Stored lowercase so one address cannot be registered twice with different capitals.
Email = Annotated[EmailStr, AfterValidator(_email)]
Password = Annotated[str, Field(min_length=8, max_length=72)]


class UserCreate(BaseModel):
    username: Username
    full_name: str = Field(min_length=1, max_length=120)
    email: Email | None = None
    profession: str = Field(default="other", max_length=40)
    password: Password


class UserUpdate(BaseModel):
    is_active: bool | None = None
    password: Password | None = None


class UserRow(BaseModel):
    id: int
    username: str
    email: str | None
    role: str
    is_active: bool
    created_at: datetime
    name: str
