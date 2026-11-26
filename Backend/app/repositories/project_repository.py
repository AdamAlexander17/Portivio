from sqlalchemy import select, update

from app.models import Project, ProjectImage
from app.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    model = Project

    def list(self, user_id: int, published_only: bool = False) -> list[Project]:
        query = select(Project).where(Project.user_id == user_id).order_by(Project.sort_order, Project.id)
        if published_only:
            query = query.where(Project.is_published.is_(True))
        return list(self.db.scalars(query))

    def get_by_slug(self, user_id: int, slug: str) -> Project | None:
        return self.db.scalar(select(Project).where(Project.user_id == user_id, Project.slug == slug))

    def slug_exists(self, slug: str) -> bool:
        return self.db.scalar(select(Project.id).where(Project.slug == slug)) is not None

    def clear_featured(self, user_id: int, except_id: int) -> None:
        self.db.execute(
            update(Project).where(Project.user_id == user_id, Project.id != except_id).values(is_featured=False)
        )
        self.db.commit()


class ProjectImageRepository(BaseRepository[ProjectImage]):
    model = ProjectImage
