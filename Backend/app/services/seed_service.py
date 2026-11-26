"""First-run sample content, so the main site looks like the design before anything is edited."""
from sqlalchemy.orm import Session

from app.core.defaults import DEFAULT_ITEMS, DEFAULT_PROFILE, DEFAULT_PROJECTS, DEFAULT_TEXTS
from app.models import ContentItem, Profile, Project
from app.repositories.profile_repository import ProfileRepository
from app.services.auth_service import AuthService
from app.services.project_service import slugify
from app.services.theme_service import LayoutService, ThemeService


def seed(db: Session) -> None:
    ThemeService(db).seed()
    LayoutService(db).seed()
    admin = AuthService(db).ensure_first_admin()

    # The admin's profile row marks "already seeded": sample content is only added once.
    if not admin or ProfileRepository(db).for_user(admin.id):
        return

    db.add(Profile(user_id=admin.id, **DEFAULT_PROFILE, texts=dict(DEFAULT_TEXTS)))

    for section, rows in DEFAULT_ITEMS.items():
        for order, (title, body, meta, items) in enumerate(rows, start=1):
            db.add(
                ContentItem(
                    user_id=admin.id, section=section, title=title, body=body, meta=meta, items=items, sort_order=order
                )
            )

    for order, (title, category, platforms, summary, featured) in enumerate(DEFAULT_PROJECTS, start=1):
        db.add(
            Project(
                user_id=admin.id, slug=slugify(title), title=title, category=category, platforms=platforms,
                summary=summary, description=summary, skills=[], is_featured=featured, sort_order=order,
            )
        )

    db.commit()
