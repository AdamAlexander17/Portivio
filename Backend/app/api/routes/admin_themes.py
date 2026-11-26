"""Themes: every signed-in user can see the library and pick a public theme;
only an admin can change the library itself."""
from fastapi import APIRouter, status

from app.api.deps import CurrentAdmin, CurrentUser, DbSession, Owner
from app.schemas.theme import ThemeOut, ThemeSelect, ThemeWrite
from app.services.site_service import SiteService
from app.services.theme_service import ThemeService

router = APIRouter(tags=["panel: themes"])


@router.get("/themes", response_model=list[ThemeOut])
def list_themes(db: DbSession):
    return ThemeService(db).list()


@router.put("/theme", response_model=ThemeOut)
def select_theme(data: ThemeSelect, owner: Owner, user: CurrentUser, db: DbSession):
    """Apply a theme to the site being managed."""
    profile = SiteService(db, owner.id).get_profile()
    return ThemeService(db).select(profile, data.theme_id, actor=user)


@router.post("/themes", response_model=ThemeOut, status_code=status.HTTP_201_CREATED)
def create_theme(data: ThemeWrite, _: CurrentAdmin, db: DbSession):
    return ThemeService(db).create(data)


@router.put("/themes/{theme_id}", response_model=ThemeOut)
def update_theme(theme_id: int, data: ThemeWrite, _: CurrentAdmin, db: DbSession):
    return ThemeService(db).update(theme_id, data)


@router.delete("/themes/{theme_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_theme(theme_id: int, _: CurrentAdmin, db: DbSession):
    ThemeService(db).delete(theme_id)
