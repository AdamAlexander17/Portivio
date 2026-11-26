from fastapi import APIRouter, UploadFile

from app.api.deps import DbSession, Owner
from app.repositories.user_repository import UserRepository
from app.schemas.profile import (
    HomeSection, HomeSectionsUpdate, ProfileOut, ProfileUpdate, SiteOut, SiteSettings, StarterRequest, TextsUpdate,
)
from app.schemas.theme import TextStyle, TextStylesUpdate, Typography
from app.services.site_service import SiteService

router = APIRouter(tags=["panel: profile"])


@router.get("/site", response_model=SiteOut)
def get_site(owner: Owner, db: DbSession):
    """The portfolio being managed, whether or not its account is active."""
    primary = UserRepository(db).first_admin()
    return SiteService(db, owner.id).get_site(owner, primary.id if primary else None)


@router.put("/profile", response_model=ProfileOut)
def update_profile(data: ProfileUpdate, owner: Owner, db: DbSession):
    return SiteService(db, owner.id).update_profile(data)


@router.put("/texts", response_model=dict[str, str])
def update_texts(data: TextsUpdate, owner: Owner, db: DbSession):
    return SiteService(db, owner.id).update_texts(data.texts)


@router.put("/settings", response_model=SiteSettings)
def update_settings(data: SiteSettings, owner: Owner, db: DbSession):
    """Save the site's options: project filter categories, contact topics and budget choices."""
    return SiteService(db, owner.id).update_settings(data.model_dump())


@router.post("/starter", response_model=SiteOut)
def apply_starter(data: StarterRequest, owner: Owner, db: DbSession):
    """Replace the site's wording and lists with the starter content of a profession."""
    service = SiteService(db, owner.id)
    service.apply_starter(data.profession, data.also)
    primary = UserRepository(db).first_admin()
    return service.get_site(owner, primary.id if primary else None)


@router.put("/home-sections", response_model=list[HomeSection])
def update_home_sections(data: HomeSectionsUpdate, owner: Owner, db: DbSession):
    """Save the order and visibility of the home page blocks."""
    return SiteService(db, owner.id).update_home_sections([row.model_dump() for row in data.sections])


@router.put("/text-styles", response_model=dict[str, TextStyle])
def update_text_styles(data: TextStylesUpdate, owner: Owner, db: DbSession):
    """Save the styles of single texts set in the visual editor (replaces the whole set)."""
    styles = {key: style.model_dump(exclude_none=True) for key, style in data.styles.items()}
    return SiteService(db, owner.id).update_text_styles(styles)


@router.put("/typography", response_model=Typography)
def update_typography(data: Typography, owner: Owner, db: DbSession):
    """Save the site's own font choices (fonts, heading size and case, text size)."""
    return SiteService(db, owner.id).update_typography(data)


@router.post("/profile/resume", response_model=ProfileOut)
def upload_resume(file: UploadFile, owner: Owner, db: DbSession):
    return SiteService(db, owner.id).set_resume(file)


@router.delete("/profile/resume", response_model=ProfileOut)
def delete_resume(owner: Owner, db: DbSession):
    return SiteService(db, owner.id).remove_resume()


@router.post("/profile/images/{field}", response_model=ProfileOut)
def upload_profile_image(field: str, file: UploadFile, owner: Owner, db: DbSession):
    return SiteService(db, owner.id).set_image(field, file)


@router.delete("/profile/images/{field}", response_model=ProfileOut)
def delete_profile_image(field: str, owner: Owner, db: DbSession):
    return SiteService(db, owner.id).remove_image(field)
