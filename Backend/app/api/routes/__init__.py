from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, require_admin
from app.api.routes import (
    admin_extras, admin_items, admin_layouts, admin_messages, admin_profile, admin_projects, admin_themes, admin_users, auth, public,
)

api_router = APIRouter(prefix="/api")
api_router.include_router(public.router)
api_router.include_router(auth.router)

# The panel: every signed-in user manages their own portfolio here.
panel_router = APIRouter(prefix="/admin", dependencies=[Depends(get_current_user)])
panel_router.include_router(admin_profile.router)
panel_router.include_router(admin_items.router)
panel_router.include_router(admin_projects.router)
panel_router.include_router(admin_messages.router)
panel_router.include_router(admin_themes.router)
panel_router.include_router(admin_layouts.router)
panel_router.include_router(admin_extras.router)
# Account management is for admins only.
panel_router.include_router(admin_users.router, dependencies=[Depends(require_admin)])
api_router.include_router(panel_router)
