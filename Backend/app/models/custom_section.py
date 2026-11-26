from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CustomSection(Base):
    """A home page block the site's owner made themselves: heading, text, image and a button.

    It is placed on the home page through the profile's `home_sections` list, as "custom:<id>".
    """

    __tablename__ = "custom_sections"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    eyebrow: Mapped[str] = mapped_column(String(80), default="")
    title: Mapped[str] = mapped_column(String(200), default="")
    body: Mapped[str] = mapped_column(Text, default="")
    image: Mapped[str] = mapped_column(String(255), default="")
    image_side: Mapped[str] = mapped_column(String(10), default="right")   # left | right
    background: Mapped[str] = mapped_column(String(10), default="plain")   # plain | tint | dark
    button_label: Mapped[str] = mapped_column(String(60), default="")
    button_url: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
