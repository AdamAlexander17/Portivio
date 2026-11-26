from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel, StrList

Section = Literal[
    "highlights", "process", "services", "industries", "faqs",
    "practices", "experience", "principles", "skills", "testimonials", "stats",
]


class ItemBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    body: str = Field(default="", max_length=5000)
    meta: str = Field(default="", max_length=255)
    items: StrList = []


class ItemCreate(ItemBase):
    section: Section


class ItemUpdate(ItemBase):
    pass


class ItemOut(ORMModel):
    id: int
    section: str
    title: str
    body: str
    meta: str
    items: list[str]
    sort_order: int
