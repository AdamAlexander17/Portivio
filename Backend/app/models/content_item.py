from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

# Every repeatable list on the site lives in this one table, split by `section`.
SECTIONS = (
    "highlights",  # home: "What I bring" strip
    "process",     # home: "How a project runs" steps
    "services",    # services: title, body, items = deliverables, meta = button label
    "industries",  # services: industry cards
    "faqs",        # services: title = question, body = answer
    "practices",   # about: "In design" / "In teaching" cards
    "experience",  # about: title = role, body = description, meta = dates
    "principles",  # about: "How I work" cards
    "skills",      # about: title = group name, items = skills
    "testimonials",  # home: title = person's name, meta = role or company, body = quote
    "stats",       # home: title = the number ("30+"), body = what it counts
)


class ContentItem(Base):
    __tablename__ = "content_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    section: Mapped[str] = mapped_column(String(40), index=True)
    title: Mapped[str] = mapped_column(String(255), default="")
    body: Mapped[str] = mapped_column(Text, default="")
    meta: Mapped[str] = mapped_column(String(255), default="")
    items: Mapped[list] = mapped_column(JSON, default=list)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
