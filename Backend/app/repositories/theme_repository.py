"""Themes and layouts are both "design libraries": admin-managed lists that each
profile picks one entry from. They share the same queries."""
from sqlalchemy import select, update

from app.models import Layout, Profile, Theme
from app.repositories.base import BaseRepository


class LibraryRepository(BaseRepository):
    profile_field = ""  # name of the Profile column that stores the chosen entry's id

    def list(self):
        return list(self.db.scalars(select(self.model).order_by(self.model.sort_order, self.model.id)))

    def default(self):
        return self.db.scalar(
            select(self.model).order_by(self.model.is_default.desc(), self.model.sort_order, self.model.id).limit(1)
        )

    def slug_exists(self, slug: str) -> bool:
        return self.db.scalar(select(self.model.id).where(self.model.slug == slug)) is not None

    def release_profiles(self, entry_id: int) -> None:
        """Sites using this entry fall back to the default one."""
        column = getattr(Profile, self.profile_field)
        self.db.execute(update(Profile).where(column == entry_id).values({self.profile_field: None}))
        self.db.commit()


class ThemeRepository(LibraryRepository):
    model = Theme
    profile_field = "theme_id"


class LayoutRepository(LibraryRepository):
    model = Layout
    profile_field = "layout_id"
