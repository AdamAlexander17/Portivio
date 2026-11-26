from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CustomSection
from app.schemas.custom_section import CustomSectionWrite
from app.services import file_service

MAX_CUSTOM_SECTIONS = 20


class CustomSectionService:
    """Home page blocks that one user made themselves."""

    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def list(self) -> list[CustomSection]:
        return list(
            self.db.scalars(select(CustomSection).where(CustomSection.user_id == self.user_id).order_by(CustomSection.id))
        )

    def get(self, section_id: int) -> CustomSection:
        section = self.db.get(CustomSection, section_id)
        if not section or section.user_id != self.user_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Section not found.")
        return section

    def _save(self, section: CustomSection) -> CustomSection:
        self.db.add(section)
        self.db.commit()
        self.db.refresh(section)
        return section

    def create(self, data: CustomSectionWrite) -> CustomSection:
        if len(self.list()) >= MAX_CUSTOM_SECTIONS:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"A site can have at most {MAX_CUSTOM_SECTIONS} custom sections.")
        return self._save(CustomSection(**data.model_dump(), user_id=self.user_id))

    def update(self, section_id: int, data: CustomSectionWrite) -> CustomSection:
        section = self.get(section_id)
        for field, value in data.model_dump().items():
            setattr(section, field, value)
        return self._save(section)

    def delete(self, section_id: int) -> None:
        section = self.get(section_id)
        image = section.image
        self.db.delete(section)
        self.db.commit()
        file_service.delete(image)

    def set_image(self, section_id: int, file: UploadFile) -> CustomSection:
        section = self.get(section_id)
        new_path = file_service.save_image(file, "sections")
        file_service.delete(section.image)
        section.image = new_path
        return self._save(section)

    def remove_image(self, section_id: int) -> CustomSection:
        section = self.get(section_id)
        file_service.delete(section.image)
        section.image = ""
        return self._save(section)

    def delete_everything(self) -> None:
        for section in self.list():
            self.delete(section.id)
