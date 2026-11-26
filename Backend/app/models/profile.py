from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Profile(Base):
    """One row per user: the site owner's identity, files and page copy."""

    __tablename__ = "profile"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    # The chosen theme; empty means the default theme.
    theme_id: Mapped[int | None] = mapped_column(ForeignKey("themes.id", ondelete="SET NULL"), nullable=True)
    # The chosen layout; empty means the default layout.
    layout_id: Mapped[int | None] = mapped_column(ForeignKey("layouts.id", ondelete="SET NULL"), nullable=True)
    # The site's own style for single parts on top of the layout preset (see schemas/layout.py LayoutOverrides).
    layout_custom: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Styles of single texts, set in the visual editor: {"t:hero_title": {"size": 120, "bold": true}, ...}
    text_styles: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # The site's own font choices on top of the theme (see schemas/theme.py Typography); empty = theme fonts.
    typography: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Order and visibility of the home page blocks: [{"key": "projects", "visible": true}, ...]; empty = default.
    home_sections: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # Per-site options: profession, project filter categories, contact form topics and budgets.
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    email: Mapped[str] = mapped_column(String(255), default="")
    location: Mapped[str] = mapped_column(String(255), default="")
    linkedin_url: Mapped[str] = mapped_column(String(500), default="")
    behance_url: Mapped[str] = mapped_column(String(500), default="")

    # Paths relative to the uploads folder.
    hero_image: Mapped[str] = mapped_column(String(255), default="")
    about_image: Mapped[str] = mapped_column(String(255), default="")
    resume_file: Mapped[str] = mapped_column(String(255), default="")
    resume_name: Mapped[str] = mapped_column(String(255), default="")

    # Editable headings and paragraphs, keyed by name (see app/core/defaults.py).
    texts: Mapped[dict] = mapped_column(JSON, default=dict)

    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    @property
    def has_resume(self) -> bool:
        return bool(self.resume_file)
