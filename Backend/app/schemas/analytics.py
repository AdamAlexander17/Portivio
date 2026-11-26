from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class TrackEvent(BaseModel):
    """Sent by the public site when a page or a project is opened."""

    kind: Literal["view", "project"]
    path: str = Field(default="", max_length=300)
    slug: str = Field(default="", max_length=160)


class DailyCount(BaseModel):
    day: date
    views: int
    visitors: int


class ProjectCount(BaseModel):
    title: str
    slug: str
    views: int


class PageCount(BaseModel):
    path: str
    views: int


class AnalyticsOut(BaseModel):
    days: int
    views: int
    visitors: int
    project_views: int
    resume_downloads: int
    messages: int
    daily: list[DailyCount]
    top_projects: list[ProjectCount]
    top_pages: list[PageCount]
