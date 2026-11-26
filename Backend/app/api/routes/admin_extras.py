"""Panel routes for custom home page sections and analytics."""
from fastapi import APIRouter, HTTPException, UploadFile, status

from app.api.deps import DbSession, Owner
from app.schemas.analytics import AnalyticsOut
from app.schemas.custom_section import CustomSectionOut, CustomSectionWrite
from app.services.analytics_service import AnalyticsService
from app.services.custom_section_service import CustomSectionService

router = APIRouter(tags=["panel: custom sections and analytics"])

ALLOWED_RANGES = (7, 30, 90)  # days


@router.get("/analytics", response_model=AnalyticsOut)
def analytics(owner: Owner, db: DbSession, days: int = 30):
    if days not in ALLOWED_RANGES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "days must be 7, 30 or 90.")
    return AnalyticsService(db, owner.id).summary(days)


@router.get("/custom-sections", response_model=list[CustomSectionOut])
def list_custom_sections(owner: Owner, db: DbSession):
    return CustomSectionService(db, owner.id).list()


@router.post("/custom-sections", response_model=CustomSectionOut, status_code=status.HTTP_201_CREATED)
def create_custom_section(data: CustomSectionWrite, owner: Owner, db: DbSession):
    return CustomSectionService(db, owner.id).create(data)


@router.put("/custom-sections/{section_id}", response_model=CustomSectionOut)
def update_custom_section(section_id: int, data: CustomSectionWrite, owner: Owner, db: DbSession):
    return CustomSectionService(db, owner.id).update(section_id, data)


@router.delete("/custom-sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_section(section_id: int, owner: Owner, db: DbSession):
    CustomSectionService(db, owner.id).delete(section_id)


@router.post("/custom-sections/{section_id}/image", response_model=CustomSectionOut)
def upload_custom_section_image(section_id: int, file: UploadFile, owner: Owner, db: DbSession):
    return CustomSectionService(db, owner.id).set_image(section_id, file)


@router.delete("/custom-sections/{section_id}/image", response_model=CustomSectionOut)
def delete_custom_section_image(section_id: int, owner: Owner, db: DbSession):
    return CustomSectionService(db, owner.id).remove_image(section_id)
