from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

KIND_VIEW = "view"        # a page of the site was opened
KIND_PROJECT = "project"  # a project's detail page was opened
KIND_RESUME = "resume"    # the resume was downloaded


class Event(Base):
    """One thing a visitor did on a site, for the owner's analytics.

    No cookies and no IP addresses: `visitor` is a hash that changes every day,
    good enough to count unique visitors per day but not to follow anyone.
    """

    __tablename__ = "events"
    __table_args__ = (Index("ix_events_user_day", "user_id", "day"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    kind: Mapped[str] = mapped_column(String(20))
    project_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    path: Mapped[str] = mapped_column(String(200), default="")
    day: Mapped[date] = mapped_column(Date)
    visitor: Mapped[str] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
