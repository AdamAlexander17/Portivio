"""Layouts: every signed-in user can see the library and pick a public layout;
only an admin can change the library itself."""
from fastapi import APIRouter, status

from app.api.deps import CurrentAdmin, CurrentUser, DbSession, Owner
from app.schemas.layout import LayoutOut, LayoutOverrides, LayoutSelect, LayoutWrite
from app.services.site_service import SiteService
from app.services.theme_service import LayoutService

router = APIRouter(tags=["panel: layouts"])


@router.get("/layouts", response_model=list[LayoutOut])
def list_layouts(db: DbSession):
    return LayoutService(db).list()


@router.put("/layout", response_model=LayoutOut)
def select_layout(data: LayoutSelect, owner: Owner, user: CurrentUser, db: DbSession):
    """Apply a layout to the site being managed."""
    site = SiteService(db, owner.id)
    chosen = LayoutService(db).select(site.get_profile(), data.layout_id, actor=user)
    site.clear_layout_custom()  # the preset applies as a whole; single parts can be changed again afterwards
    return chosen


@router.put("/layout-options", response_model=LayoutOverrides)
def customise_layout(data: LayoutOverrides, owner: Owner, db: DbSession):
    """Save the site's own style for single parts (navbar, hero, projects...), on top of its preset."""
    return SiteService(db, owner.id).update_layout_custom(data)


@router.post("/layouts", response_model=LayoutOut, status_code=status.HTTP_201_CREATED)
def create_layout(data: LayoutWrite, _: CurrentAdmin, db: DbSession):
    return LayoutService(db).create(data)


@router.put("/layouts/{layout_id}", response_model=LayoutOut)
def update_layout(layout_id: int, data: LayoutWrite, _: CurrentAdmin, db: DbSession):
    return LayoutService(db).update(layout_id, data)


@router.delete("/layouts/{layout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_layout(layout_id: int, _: CurrentAdmin, db: DbSession):
    LayoutService(db).delete(layout_id)
