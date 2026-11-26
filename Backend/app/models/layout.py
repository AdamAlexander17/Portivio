from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Layout(Base):
    """A site structure: which style each part of the page uses (navbar, hero, projects...).

    Works like Theme: a library that admins manage, with public and private entries,
    and every portfolio uses one. A theme is the look; a layout is the arrangement.
    """

    __tablename__ = "layouts"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True)
    name: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(String(255), default="")
    visibility: Mapped[str] = mapped_column(String(20), default="public")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    # See app/schemas/layout.py (LayoutOptions) for the shape of this value.
    options: Mapped[dict] = mapped_column(JSON)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
