"""Routes visitors use. No login needed.

Each one works on one portfolio: `?user=<username>` picks it, and without
that parameter it is the primary (admin's) portfolio.
"""
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import FileResponse

from app.api.deps import DbSession, PublicOwner
from app.core.config import settings
from app.core.professions import profession_options
from app.core.rate_limit import rate_limit
from app.models.theme import VISIBILITY_PUBLIC
from app.models.event import KIND_RESUME, KIND_VIEW
from app.repositories.user_repository import UserRepository
from app.schemas.analytics import TrackEvent
from app.schemas.common import Detail
from app.schemas.message import MessageCreate
from app.schemas.profile import SiteOut
from app.schemas.project import ProjectCard, ProjectDetail
from app.schemas.theme import ShowcaseOut
from app.services import file_service
from app.services.analytics_service import AnalyticsService
from app.services.message_service import MessageService
from app.services.project_service import ProjectService
from app.services.site_service import SiteService
from app.services.theme_service import LayoutService, ThemeService

router = APIRouter(tags=["public"])


@router.get("/showcase", response_model=ShowcaseOut)
def showcase(db: DbSession):
    """What the product's landing page shows: the themes anyone can pick, and a few real numbers."""
    # Only what a new user can actually pick, so the page never promises more than they get.
    themes = [theme for theme in ThemeService(db).list() if theme.visibility == VISIBILITY_PUBLIC]
    return {
        "allow_signup": settings.ALLOW_SIGNUP,
        "themes": themes[:6],
        "theme_count": len(themes),
        "layout_count": len(LayoutService(db).list()),
        "professions": profession_options(),
    }


@router.get("/site", response_model=SiteOut)
def get_site(owner: PublicOwner, db: DbSession):
    primary = UserRepository(db).first_admin()
    return SiteService(db, owner.id).get_site(owner, primary.id if primary else None)


@router.get("/projects", response_model=list[ProjectCard])
def list_projects(owner: PublicOwner, db: DbSession):
    return ProjectService(db, owner.id).list(published_only=True)


@router.get("/projects/{slug}", response_model=ProjectDetail)
def get_project(slug: str, owner: PublicOwner, db: DbSession):
    return ProjectService(db, owner.id).get_published_by_slug(slug)


@router.post("/track", status_code=status.HTTP_204_NO_CONTENT, dependencies=[rate_limit("track", 240, 60)])
def track(data: TrackEvent, request: Request, owner: PublicOwner, db: DbSession):
    """Count a page view or a project view for the site owner's analytics."""
    analytics = AnalyticsService(db, owner.id)
    if data.kind == "project":
        analytics.record_project_view(data.slug, request)
    else:
        analytics.record(KIND_VIEW, request, path=data.path)


@router.post(
    "/messages", response_model=Detail, status_code=status.HTTP_201_CREATED,
    dependencies=[rate_limit("messages", 8, 600)],
)
def send_message(data: MessageCreate, owner: PublicOwner, db: DbSession):
    MessageService(db, owner.id).create(data)
    return {"detail": "Message sent."}


@router.get("/resume")
def download_resume(request: Request, owner: PublicOwner, db: DbSession):
    profile = SiteService(db, owner.id).get_profile()
    path = file_service.resolve(profile.resume_file)
    if not path:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No resume has been uploaded yet.")
    AnalyticsService(db, owner.id).record(KIND_RESUME, request)
    name = "-".join(profile.name.split()) or "Resume"
    return FileResponse(path, filename=f"{name}-Resume{Path(path).suffix}")
