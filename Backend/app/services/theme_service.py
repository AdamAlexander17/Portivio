"""Themes (the look) and layouts (the arrangement) follow the same rules:

- every signed-in user can see the whole library;
- a public entry can be picked by anyone, a private one only by an admin;
- only admins create, edit and delete entries;
- the default entry is used by sites that have not picked one, and it cannot be
  deleted or made private.
"""
from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.default_layouts import DEFAULT_LAYOUTS
from app.core.default_themes import DEFAULT_THEMES
from app.models import Layout, Profile, Theme, User
from app.models.theme import VISIBILITY_PRIVATE
from app.repositories.profile_repository import ProfileRepository
from app.repositories.theme_repository import LayoutRepository, LibraryRepository, ThemeRepository
from app.services.project_service import slugify


class LibraryService:
    repository_class: type[LibraryRepository]
    model: type
    defaults: list[dict]
    noun: str  # "theme" or "layout", used in messages

    def __init__(self, db: Session):
        self.entries = self.repository_class(db)
        self.profiles = ProfileRepository(db)
        self.profile_field = self.entries.profile_field

    def seed(self) -> None:
        """Add the ready-made entries to a database that has none."""
        if self.entries.count():
            return
        for order, data in enumerate(self.defaults, start=1):
            self.entries.save(self.model(**data, slug=slugify(data["name"]), sort_order=order))

    # ---- reading -------------------------------------------------------
    def list(self):
        return self.entries.list()

    def get(self, entry_id: int):
        entry = self.entries.get(entry_id)
        if not entry:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"{self.noun.capitalize()} not found.")
        return entry

    def for_profile(self, profile: Profile):
        """The entry a site is shown with: its chosen one, or the default."""
        chosen_id = getattr(profile, self.profile_field)
        chosen = self.entries.get(chosen_id) if chosen_id else None
        return chosen or self.entries.default()

    # ---- choosing an entry for a site ----------------------------------
    def select(self, profile: Profile, entry_id: int, actor: User):
        entry = self.get(entry_id)
        if entry.visibility == VISIBILITY_PRIVATE and not actor.is_admin:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, f"This {self.noun} is private. Ask the admin to make it available."
            )
        setattr(profile, self.profile_field, entry.id)
        self.profiles.save(profile)
        return entry

    # ---- managing the library (admin) ----------------------------------
    def _unique_slug(self, name: str) -> str:
        base = slugify(name)[:70]
        slug, number = base, 2
        while self.entries.slug_exists(slug):
            slug = f"{base}-{number}"
            number += 1
        return slug

    def create(self, data: BaseModel):
        return self.entries.save(
            self.model(
                **data.model_dump(),
                slug=self._unique_slug(data.name),
                sort_order=self.entries.next_sort_order(),
            )
        )

    def update(self, entry_id: int, data: BaseModel):
        entry = self.get(entry_id)
        if entry.is_default and data.visibility == VISIBILITY_PRIVATE:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"The default {self.noun} must stay public.")
        for field, value in data.model_dump().items():
            setattr(entry, field, value)
        return self.entries.save(entry)

    def delete(self, entry_id: int) -> None:
        entry = self.get(entry_id)
        if entry.is_default:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"The default {self.noun} cannot be deleted.")
        self.entries.release_profiles(entry.id)
        self.entries.delete(entry)


class ThemeService(LibraryService):
    repository_class = ThemeRepository
    model = Theme
    defaults = DEFAULT_THEMES
    noun = "theme"


class LayoutService(LibraryService):
    repository_class = LayoutRepository
    model = Layout
    defaults = DEFAULT_LAYOUTS
    noun = "layout"
