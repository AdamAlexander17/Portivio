from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


# Keep these lists in step with Frontend/src/layout.js.
class LayoutOptions(BaseModel):
    nav: Literal["classic", "minimal", "centered", "pill"] = "classic"
    hero: Literal["split", "reverse", "centered", "statement"] = "split"
    projects: Literal["grid", "compact", "list", "overlay"] = "grid"
    headings: Literal["left", "center"] = "left"
    footer: Literal["columns", "simple"] = "columns"
    width: Literal["narrow", "standard", "wide"] = "standard"
    # Parts added later. Their defaults are the original look, so older presets need no change.
    process: Literal["cards", "list"] = "cards"
    stats: Literal["line", "cards"] = "line"
    testimonials: Literal["cards", "large"] = "cards"
    services: Literal["list", "cards"] = "list"
    about: Literal["split", "reverse", "centered"] = "split"
    contact: Literal["split", "centered"] = "split"


class LayoutOverrides(BaseModel):
    """A site's own choice for any part, on top of its preset. A part left out follows the preset."""

    nav: Literal["classic", "minimal", "centered", "pill"] | None = None
    hero: Literal["split", "reverse", "centered", "statement"] | None = None
    projects: Literal["grid", "compact", "list", "overlay"] | None = None
    headings: Literal["left", "center"] | None = None
    footer: Literal["columns", "simple"] | None = None
    width: Literal["narrow", "standard", "wide"] | None = None
    process: Literal["cards", "list"] | None = None
    stats: Literal["line", "cards"] | None = None
    testimonials: Literal["cards", "large"] | None = None
    services: Literal["list", "cards"] | None = None
    about: Literal["split", "reverse", "centered"] | None = None
    contact: Literal["split", "centered"] | None = None


class LayoutWrite(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=255)
    visibility: Literal["public", "private"] = "public"
    options: LayoutOptions


class LayoutOut(ORMModel):
    id: int
    slug: str
    name: str
    description: str
    visibility: str
    is_default: bool
    options: LayoutOptions


class LayoutSelect(BaseModel):
    layout_id: int
