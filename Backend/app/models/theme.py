from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

VISIBILITY_PUBLIC = "public"
VISIBILITY_PRIVATE = "private"


class Theme(Base):
    """A site look: colours, fonts and shape. Every portfolio uses one theme.

    public   any user can pick it for their site
    private  users see it greyed out and cannot pick it; only an admin can apply it
    """

    __tablename__ = "themes"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True)
    name: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(String(255), default="")
    visibility: Mapped[str] = mapped_column(String(20), default=VISIBILITY_PUBLIC)
    # The theme used by any site that has not picked one. It cannot be deleted or made private.
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    # See app/schemas/theme.py (ThemeTokens) for the shape of this value.
    tokens: Mapped[dict] = mapped_column(JSON)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
