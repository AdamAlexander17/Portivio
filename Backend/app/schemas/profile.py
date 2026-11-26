from typing import Annotated
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import HttpLink, LabelList, ORMModel, PartKeys
from app.schemas.content_item import ItemOut
from app.schemas.custom_section import CustomSectionOut
from app.schemas.layout import LayoutOptions, LayoutOut, LayoutOverrides
from app.schemas.theme import TextStyle, ThemeOut, Typography


class ProfileOut(ORMModel):
    name: str
    email: str
    location: str
    linkedin_url: str
    behance_url: str
    hero_image: str
    about_image: str
    resume_name: str
    has_resume: bool


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr | Literal[""] = ""
    location: str = Field(default="", max_length=255)
    linkedin_url: HttpLink = Field(default="", max_length=500)
    behance_url: HttpLink = Field(default="", max_length=500)


class TextsUpdate(BaseModel):
    texts: dict[str, str]


class HomeSection(BaseModel):
    """One block of the home page. Keys are listed in core/defaults.py (HOME_SECTION_KEYS)."""

    # A built-in block, or one of the user's own sections as "custom:<id>".
    key: str = Field(
        pattern=r"^(?:highlights|projects|stats|process|services|testimonials|experience|skills|faq|teach|contact|cta|custom:\d{1,10})$"
    )
    visible: bool = True


class HomeSectionsUpdate(BaseModel):
    sections: list[HomeSection] = Field(max_length=30)


class SiteSettings(BaseModel):
    """Options that make a site fit its owner's kind of work."""

    profession: str = Field(default="other", max_length=40)
    project_filters: LabelList = []   # the filter tabs above the projects; empty hides them
    contact_topics: LabelList = []    # "What is this about?" choices on the contact form
    budget_options: LabelList = []    # empty hides the budget field
    hidden: PartKeys = []             # pages and page parts the owner switched off


class StarterRequest(BaseModel):
    profession: str = Field(max_length=40)
    # Further kinds of work the person does; their starter content is added to the main one's.
    also: list[Annotated[str, Field(max_length=40)]] = Field(default=[], max_length=8)


class OwnerOut(BaseModel):
    username: str
    is_primary: bool  # true for the account whose site is shown at the root address


class SiteOut(BaseModel):
    """Everything the public pages need except projects."""

    owner: OwnerOut
    theme: ThemeOut | None
    layout: LayoutOut | None
    layout_custom: LayoutOverrides    # the parts this site styled itself
    layout_options: LayoutOptions     # the result: preset + the site's own choices
    typography: Typography
    text_styles: dict[str, TextStyle]
    home_sections: list[HomeSection]
    custom_sections: list[CustomSectionOut]
    settings: SiteSettings
    profile: ProfileOut
    texts: dict[str, str]
    sections: dict[str, list[ItemOut]]
