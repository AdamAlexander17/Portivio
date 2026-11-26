from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

PLATFORMS = ("mobile", "web", "dashboard")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    slug: Mapped[str] = mapped_column(String(160), unique=True)
    title: Mapped[str] = mapped_column(String(150))
    category: Mapped[str] = mapped_column(String(150), default="")  # e.g. "Web app · Fintech"
    platforms: Mapped[list] = mapped_column(JSON, default=list)      # drives the filter tabs
    summary: Mapped[str] = mapped_column(String(500), default="")    # short card text
    description: Mapped[str] = mapped_column(Text, default="")       # full explanation
    # The case study: a list of blocks (heading, text, image, quote, video). See schemas/project.py.
    content: Mapped[list | None] = mapped_column(JSON, nullable=True)
    role: Mapped[str] = mapped_column(String(150), default="")
    client: Mapped[str] = mapped_column(String(150), default="")
    timeline: Mapped[str] = mapped_column(String(100), default="")
    skills: Mapped[list] = mapped_column(JSON, default=list)
    live_url: Mapped[str] = mapped_column(String(500), default="")
    case_url: Mapped[str] = mapped_column(String(500), default="")
    thumbnail: Mapped[str] = mapped_column(String(255), default="")
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    images: Mapped[list["ProjectImage"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="ProjectImage.sort_order, ProjectImage.id",
    )


class ProjectImage(Base):
    __tablename__ = "project_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    image: Mapped[str] = mapped_column(String(255))
    caption: Mapped[str] = mapped_column(String(255), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    project: Mapped[Project] = relationship(back_populates="images")
