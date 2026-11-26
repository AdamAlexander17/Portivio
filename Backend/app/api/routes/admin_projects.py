from fastapi import APIRouter, UploadFile, status

from app.api.deps import DbSession, Owner
from app.schemas.common import Reorder
from app.schemas.project import (
    ContentImageOut, ImageCaption, ProjectCard, ProjectContent, ProjectDetail, ProjectWrite,
)
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["panel: projects"])


@router.get("", response_model=list[ProjectCard])
def list_projects(owner: Owner, db: DbSession):
    return ProjectService(db, owner.id).list()


@router.post("", response_model=ProjectDetail, status_code=status.HTTP_201_CREATED)
def create_project(data: ProjectWrite, owner: Owner, db: DbSession):
    return ProjectService(db, owner.id).create(data)


@router.put("/reorder", response_model=list[ProjectCard])
def reorder_projects(data: Reorder, owner: Owner, db: DbSession):
    return ProjectService(db, owner.id).reorder(data.ids)


@router.patch("/images/{image_id}", response_model=ProjectDetail)
def set_image_caption(image_id: int, data: ImageCaption, owner: Owner, db: DbSession):
    return ProjectService(db, owner.id).set_caption(image_id, data.caption)


@router.delete("/images/{image_id}", response_model=ProjectDetail)
def delete_image(image_id: int, owner: Owner, db: DbSession):
    return ProjectService(db, owner.id).delete_image(image_id)


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(project_id: int, owner: Owner, db: DbSession):
    return ProjectService(db, owner.id).get(project_id)


@router.put("/{project_id}", response_model=ProjectDetail)
def update_project(project_id: int, data: ProjectWrite, owner: Owner, db: DbSession):
    return ProjectService(db, owner.id).update(project_id, data)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, owner: Owner, db: DbSession):
    ProjectService(db, owner.id).delete(project_id)


@router.post("/{project_id}/thumbnail", response_model=ProjectDetail)
def upload_thumbnail(project_id: int, file: UploadFile, owner: Owner, db: DbSession):
    return ProjectService(db, owner.id).set_thumbnail(project_id, file)


@router.delete("/{project_id}/thumbnail", response_model=ProjectDetail)
def delete_thumbnail(project_id: int, owner: Owner, db: DbSession):
    return ProjectService(db, owner.id).remove_thumbnail(project_id)


@router.post("/{project_id}/images", response_model=ProjectDetail)
def upload_images(project_id: int, files: list[UploadFile], owner: Owner, db: DbSession):
    return ProjectService(db, owner.id).add_images(project_id, files)


@router.put("/{project_id}/images/reorder", response_model=ProjectDetail)
def reorder_images(project_id: int, data: Reorder, owner: Owner, db: DbSession):
    return ProjectService(db, owner.id).reorder_images(project_id, data.ids)


@router.put("/{project_id}/content", response_model=ProjectDetail)
def save_case_study(project_id: int, data: ProjectContent, owner: Owner, db: DbSession):
    """Replace the project's case study blocks."""
    blocks = [block.model_dump() for block in data.blocks]
    return ProjectService(db, owner.id).set_content(project_id, blocks)


@router.post("/{project_id}/content-image", response_model=ContentImageOut)
def upload_case_study_image(project_id: int, file: UploadFile, owner: Owner, db: DbSession):
    """Upload an image to use in an image block of the case study."""
    return {"image": ProjectService(db, owner.id).add_content_image(project_id, file)}
