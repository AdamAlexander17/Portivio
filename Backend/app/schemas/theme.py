from typing import Annotated, Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel

# Only plain six-digit hex colours are accepted, so a theme can never carry other CSS.
HexColor = Annotated[str, Field(pattern=r"^#[0-9a-fA-F]{6}$")]

# Keep these lists in step with Frontend/src/theme.js.
HeadingFont = Literal[
    "newsreader", "playfair", "fraunces", "dm-serif", "cormorant",
    "space-grotesk", "sora", "manrope", "inter", "poppins", "outfit", "syne", "bebas",
]
BodyFont = Literal[
    "dm-sans", "inter", "manrope", "work-sans", "space-grotesk", "poppins", "outfit", "nunito-sans", "source-sans",
]
LogoFont = Literal["script", "heading"]


class ThemeColors(BaseModel):
    bg: HexColor
    surface: HexColor
    text: HexColor
    accent: HexColor
    on_accent: HexColor
    tint: HexColor
    dark: HexColor


class ThemeTokens(BaseModel):
    scheme: Literal["light", "dark"] = "light"
    shape: Literal["rounded", "soft", "sharp"] = "rounded"
    heading_font: HeadingFont = "newsreader"
    body_font: BodyFont = "dm-sans"
    logo_font: LogoFont = "heading"
    colors: ThemeColors


class Typography(BaseModel):
    """A site's own font choices, on top of its theme. An empty font means "use the theme's"."""

    heading_font: HeadingFont | None = None
    body_font: BodyFont | None = None
    logo_font: LogoFont | None = None
    heading_scale: Literal["compact", "normal", "large"] = "normal"
    heading_case: Literal["normal", "uppercase"] = "normal"
    text_scale: Literal["small", "normal", "large"] = "normal"


class ThemeWrite(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=255)
    visibility: Literal["public", "private"] = "public"
    tokens: ThemeTokens


class ThemeOut(ORMModel):
    id: int
    slug: str
    name: str
    description: str
    visibility: str
    is_default: bool
    tokens: ThemeTokens


class TextStyle(BaseModel):
    """How one piece of text is shown, set in the visual editor. Anything left out keeps the theme's look."""

    font: HeadingFont | BodyFont | None = None
    size: int | None = Field(default=None, ge=50, le=300)   # percent of the text's normal size
    bold: bool | None = None
    italic: bool | None = None
    underline: bool | None = None
    align: Literal["left", "center", "right"] | None = None
    color: HexColor | None = None
    # How far it was dragged from its own place, in pixels (wide screens only).
    x: int | None = Field(default=None, ge=-1500, le=1500)
    y: int | None = Field(default=None, ge=-1500, le=1500)


# A page text ("t:hero_title"), a movable block ("b:hero_photo") or one field of a list entry ("i:42:title").
TextKey = Annotated[str, Field(pattern=r"^(?:[tb]:[a-z0-9_]{2,40}|i:\d{1,10}:(?:title|body|meta))$")]


class TextStylesUpdate(BaseModel):
    styles: dict[TextKey, TextStyle] = Field(max_length=400)


class ShowcaseOut(BaseModel):
    """Public information for the product's landing page."""

    allow_signup: bool
    themes: list[ThemeOut]
    theme_count: int
    layout_count: int
    professions: list[dict[str, str]]


class ThemeSelect(BaseModel):
    theme_id: int
