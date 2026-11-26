"""One user's profile, page copy and uploaded profile files."""
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.defaults import DEFAULT_TEXTS, normalise_home_sections
from app.core.professions import (
    DEFAULT_BUDGET_OPTIONS, DEFAULT_CONTACT_TOPICS, DEFAULT_PROJECT_FILTERS, starter_content,
)
from app.models import ContentItem
from app.models import Profile, User
from app.models.content_item import SECTIONS
from app.repositories.item_repository import ItemRepository
from app.repositories.profile_repository import ProfileRepository
from pydantic import ValidationError

from app.schemas.layout import LayoutOptions, LayoutOverrides
from app.schemas.profile import ProfileUpdate
from app.schemas.theme import TextStyle, Typography
from app.services import file_service
from app.services.custom_section_service import CustomSectionService
from app.services.theme_service import LayoutService, ThemeService

IMAGE_FIELDS = ("hero_image", "about_image")


class SiteService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
        self.profiles = ProfileRepository(db)
        self.items = ItemRepository(db)

    def get_profile(self) -> Profile:
        profile = self.profiles.for_user(self.user_id)
        if not profile:
            profile = self.profiles.save(Profile(user_id=self.user_id, texts={}))
        return profile

    def get_texts(self) -> dict[str, str]:
        """Saved copy on top of the defaults, so a newly added key always has a value."""
        saved = self.get_profile().texts or {}
        return {**DEFAULT_TEXTS, **{k: v for k, v in saved.items() if k in DEFAULT_TEXTS}}

    def get_site(self, owner: User, primary_id: int | None) -> dict:
        sections: dict[str, list] = {name: [] for name in SECTIONS}
        for item in self.items.list(self.user_id):
            sections.setdefault(item.section, []).append(item)
        profile = self.get_profile()
        custom = CustomSectionService(self.db, self.user_id).list()
        preset = LayoutService(self.db).for_profile(profile)
        custom_layout = self.get_layout_custom(profile)
        return {
            "owner": {"username": owner.username, "is_primary": owner.id == primary_id},
            "theme": ThemeService(self.db).for_profile(profile),
            "layout": preset,
            "layout_custom": custom_layout,
            "layout_options": {**LayoutOptions(**(preset.options if preset else {})).model_dump(), **custom_layout},
            "typography": self._typography(profile),
            "text_styles": self.get_text_styles(profile),
            "home_sections": normalise_home_sections(profile.home_sections, [c.id for c in custom]),
            "custom_sections": custom,
            "settings": self.get_settings(profile),
            "profile": profile,
            "texts": self.get_texts(),
            "sections": sections,
        }

    @staticmethod
    def _typography(profile: Profile) -> Typography:
        """The saved font choices, or the defaults if none (or an outdated value) is stored."""
        try:
            return Typography(**(profile.typography or {}))
        except ValidationError:
            return Typography()

    @staticmethod
    def get_settings(profile: Profile) -> dict:
        """Saved options, or the defaults for a site that has not set any."""
        saved = profile.settings
        if not saved:
            return {
                "profession": "other", "project_filters": DEFAULT_PROJECT_FILTERS,
                "contact_topics": DEFAULT_CONTACT_TOPICS, "budget_options": DEFAULT_BUDGET_OPTIONS,
                "hidden": [],
            }
        return {
            "profession": saved.get("profession") or "other",
            "project_filters": saved.get("project_filters") or [],
            "contact_topics": saved.get("contact_topics") or DEFAULT_CONTACT_TOPICS,
            "budget_options": saved.get("budget_options") or [],
            "hidden": saved.get("hidden") or [],
        }

    def update_settings(self, data: dict) -> dict:
        profile = self.get_profile()
        profile.settings = data
        self.profiles.save(profile)
        return self.get_settings(profile)

    def apply_starter(self, profession: str, also: list[str] | tuple = ()) -> None:
        """Fill the site with the starter content of a profession.

        Replaces the page copy the template covers, the options, and the list
        sections the template has content for. Projects, photos, the resume,
        messages and custom sections are never touched.
        """
        profile = self.get_profile()
        starter = starter_content(profession, profile.name, also)
        profile.texts = {**(profile.texts or {}), **starter["texts"]}
        # New wording and options, but what the owner chose to hide stays hidden.
        profile.settings = {**starter["settings"], "hidden": (profile.settings or {}).get("hidden") or []}
        self.profiles.save(profile)
        for section, rows in starter["items"].items():
            if not rows:
                continue
            self.items.delete_section(self.user_id, section)
            for order, (title, body, meta, items) in enumerate(rows, start=1):
                self.db.add(
                    ContentItem(
                        user_id=self.user_id, section=section, title=title, body=body,
                        meta=meta, items=items, sort_order=order,
                    )
                )
        self.db.commit()

    @staticmethod
    def get_text_styles(profile: Profile) -> dict:
        """Saved text styles, leaving out any entry that is no longer valid."""
        styles = {}
        for key, value in (profile.text_styles or {}).items():
            try:
                style = TextStyle(**value).model_dump(exclude_none=True)
            except (ValidationError, TypeError):
                continue
            if style:
                styles[key] = style
        return styles

    def update_text_styles(self, styles: dict) -> dict:
        profile = self.get_profile()
        # Only what was actually set is kept, so an untouched text stays out of the list.
        profile.text_styles = {key: value for key, value in styles.items() if value}
        self.profiles.save(profile)
        return self.get_text_styles(profile)

    @staticmethod
    def get_layout_custom(profile: Profile) -> dict:
        """The parts this site styled itself, keeping only choices that are still valid."""
        try:
            return LayoutOverrides(**(profile.layout_custom or {})).model_dump(exclude_none=True)
        except ValidationError:
            return {}

    def update_layout_custom(self, data: LayoutOverrides) -> dict:
        profile = self.get_profile()
        profile.layout_custom = data.model_dump(exclude_none=True)
        self.profiles.save(profile)
        return profile.layout_custom

    def clear_layout_custom(self) -> None:
        """Picking a preset starts again from that preset as a whole."""
        profile = self.get_profile()
        profile.layout_custom = None
        self.profiles.save(profile)

    def update_home_sections(self, sections: list[dict]) -> list[dict]:
        profile = self.get_profile()
        custom_ids = [c.id for c in CustomSectionService(self.db, self.user_id).list()]
        profile.home_sections = normalise_home_sections(sections, custom_ids)
        self.profiles.save(profile)
        return profile.home_sections

    def update_typography(self, data: Typography) -> Typography:
        profile = self.get_profile()
        profile.typography = data.model_dump()
        self.profiles.save(profile)
        return data

    def update_profile(self, data: ProfileUpdate) -> Profile:
        profile = self.get_profile()
        for field, value in data.model_dump().items():
            setattr(profile, field, value)
        return self.profiles.save(profile)

    def update_texts(self, texts: dict[str, str]) -> dict[str, str]:
        profile = self.get_profile()
        cleaned = {k: v.strip()[:3000] for k, v in texts.items() if k in DEFAULT_TEXTS}
        profile.texts = {**(profile.texts or {}), **cleaned}
        self.profiles.save(profile)
        return self.get_texts()

    def set_image(self, field: str, file: UploadFile) -> Profile:
        if field not in IMAGE_FIELDS:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown image.")
        profile = self.get_profile()
        new_path = file_service.save_image(file, "profile")
        file_service.delete(getattr(profile, field))
        setattr(profile, field, new_path)
        return self.profiles.save(profile)

    def remove_image(self, field: str) -> Profile:
        if field not in IMAGE_FIELDS:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown image.")
        profile = self.get_profile()
        file_service.delete(getattr(profile, field))
        setattr(profile, field, "")
        return self.profiles.save(profile)

    def set_resume(self, file: UploadFile) -> Profile:
        profile = self.get_profile()
        new_path = file_service.save_resume(file)
        file_service.delete(profile.resume_file)
        profile.resume_file = new_path
        profile.resume_name = (file.filename or "resume")[:255]
        return self.profiles.save(profile)

    def remove_resume(self) -> Profile:
        profile = self.get_profile()
        file_service.delete(profile.resume_file)
        profile.resume_file = ""
        profile.resume_name = ""
        return self.profiles.save(profile)

    def delete_everything(self) -> None:
        """Remove the profile row and its files. Used when the account is deleted."""
        profile = self.profiles.for_user(self.user_id)
        if profile:
            for path in (profile.hero_image, profile.about_image, profile.resume_file):
                file_service.delete(path)
            self.profiles.delete(profile)
        self.items.delete_for_user(self.user_id)
        CustomSectionService(self.db, self.user_id).delete_everything()
