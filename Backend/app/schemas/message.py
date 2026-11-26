from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import ORMModel


class MessageCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    topic: str = Field(default="", max_length=80)
    company: str = Field(default="", max_length=150)
    budget: str = Field(default="", max_length=80)
    message: str = Field(min_length=1, max_length=4000)
    # Hidden field on the form. Real visitors leave it empty; bots fill it in.
    website: str = Field(default="", max_length=255)


class MessageOut(ORMModel):
    id: int
    name: str
    email: str
    topic: str
    company: str
    budget: str
    message: str
    is_read: bool
    created_at: datetime


class MessageRead(BaseModel):
    is_read: bool


class Stats(BaseModel):
    projects: int
    published_projects: int
    messages: int
    unread_messages: int
