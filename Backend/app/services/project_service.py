import re

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models import Project, ProjectImage
from app.repositories.project_repository import ProjectImageRepository, ProjectRepository
from app.schemas.project import ProjectWrite
from app.services import file_service

MAX_GALLERY_IMAGES = 30


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:120] or "project"


class ProjectService:
    """Projects belonging to one user."""

    def __init__(self, db: Session, user_id: int):
        self.user_id = user_id
        self.projects = ProjectRepository(db)
        self.images = ProjectImageRepository(db)

    # ---- reading -------------------------------------------------------
    def list(self, published_only: bool = False) -> list[Project]:
        return self.projects.list(self.user_id, published_only)

    def get(self, project_id: int) -> Project:
        project = self.projects.get(project_id)
        if not project or project.user_id != self.user_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found.")
        return project

    def get_published_by_slug(self, slug: str) -> Project:
        project = self.projects.get_by_slug(self.user_id, slug)
        if not project or not project.is_published:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found.")
        return project

    # ---- writing -------------------------------------------------------
    def _unique_slug(self, title: str) -> str:
        base = slugify(title)
        slug, number = base, 2
        while self.projects.slug_exists(slug):
            slug = f"{base}-{number}"
            number += 1
        return slug

    def create(self, data: ProjectWrite) -> Project:
        project = Project(
            **data.model_dump(),
            user_id=self.user_id,
            slug=self._unique_slug(data.title),
            sort_order=self.projects.next_sort_order(Project.user_id == self.user_id),
        )
        project = self.projects.save(project)
        if project.is_featured:
            self.projects.clear_featured(self.user_id, except_id=project.id)
        return project

    def update(self, project_id: int, data: ProjectWrite) -> Project:
        project = self.get(project_id)
        for field, value in data.model_dump().items():
            setattr(project, field, value)
        project = self.projects.save(project)
        if project.is_featured:
            self.projects.clear_featured(self.user_id, except_id=project.id)
        return project

    def delete(self, project_id: int) -> None:
        project = self.get(project_id)
        paths = [project.thumbnail, *(image.image for image in project.images)]
        self.projects.delete(project)
        for path in paths:
            file_service.delete(path)
        file_service.delete_folder(self._case_folder(project_id))

    # ---- case study ----------------------------------------------------
    @staticmethod
    def _case_folder(project_id: int) -> str:
        return f"case/{project_id}"

    def add_content_image(self, project_id: int, file: UploadFile) -> str:
        """Store an image for the case study. It is kept once a saved block uses it."""
        project = self.get(project_id)
        return file_service.save_image(file, self._case_folder(project.id))

    def set_content(self, project_id: int, blocks: list[dict]) -> Project:
        project = self.get(project_id)
        folder = self._case_folder(project.id)
        used = {block["image"] for block in blocks if block["type"] == "image"}
        # An image block may only point at a file uploaded for this same project.
        if any(not path.startswith(folder + "/") for path in used):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "An image in the case study does not belong to this project.")
        project.content = blocks
        project = self.projects.save(project)
        for path in file_service.list_folder(folder):  # drop images no block uses any more
            if path not in used:
                file_service.delete(path)
        return project

    def delete_everything(self) -> None:
        """Remove every project and its files. Used when the account is deleted."""
        for project in self.projects.list(self.user_id):
            self.delete(project.id)

    def reorder(self, ids: list[int]) -> list[Project]:
        self.projects.reorder(ids, Project.user_id == self.user_id)
        return self.list()

    # ---- files ---------------------------------------------------------
    def set_thumbnail(self, project_id: int, file: UploadFile) -> Project:
        project = self.get(project_id)
        new_path = file_service.save_image(file, "projects")
        file_service.delete(project.thumbnail)
        project.thumbnail = new_path
        return self.projects.save(project)

    def remove_thumbnail(self, project_id: int) -> Project:
        project = self.get(project_id)
        file_service.delete(project.thumbnail)
        project.thumbnail = ""
        return self.projects.save(project)

    def add_images(self, project_id: int, files: list[UploadFile]) -> Project:
        project = self.get(project_id)
        if len(project.images) + len(files) > MAX_GALLERY_IMAGES:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, f"A project can have at most {MAX_GALLERY_IMAGES} gallery images."
            )
        order = max((image.sort_order for image in project.images), default=0)
        for file in files:
            order += 1
            path = file_service.save_image(file, "projects")
            project.images.append(ProjectImage(image=path, sort_order=order))
        return self.projects.save(project)

    def _get_image(self, image_id: int) -> ProjectImage:
        image = self.images.get(image_id)
        if not image or image.project.user_id != self.user_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Image not found.")
        return image

    def set_caption(self, image_id: int, caption: str) -> Project:
        image = self._get_image(image_id)
        image.caption = caption.strip()
        self.images.save(image)
        return self._fresh(image.project_id)

    def delete_image(self, image_id: int) -> Project:
        image = self._get_image(image_id)
        project_id, path = image.project_id, image.image
        self.images.delete(image)
        file_service.delete(path)
        return self._fresh(project_id)

    def reorder_images(self, project_id: int, ids: list[int]) -> Project:
        self.get(project_id)  # checks the project belongs to this user
        self.images.reorder(ids, ProjectImage.project_id == project_id)
        return self._fresh(project_id)

    def _fresh(self, project_id: int) -> Project:
        project = self.get(project_id)
        self.projects.db.refresh(project)
        return project
