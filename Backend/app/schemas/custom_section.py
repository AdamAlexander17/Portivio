from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, Field, model_validator

from app.schemas.common import ORMModel


def _link_or_path(value: str) -> str:
    """Empty, a full http(s) link, or a path on this site such as /contact."""
    value = value.strip()
    if not value:
        return value
    on_site = value.startswith("/") and not value.startswith("//") and "\\" not in value
    if on_site or value.lower().startswith(("http://", "https://")):
        return value
    raise ValueError("Use a full link starting with https:// or a page path such as /contact")


LinkOrPath = Annotated[str, AfterValidator(_link_or_path)]


class CustomSectionWrite(BaseModel):
    eyebrow: str = Field(default="", max_length=80)
    title: str = Field(default="", max_length=200)
    body: str = Field(default="", max_length=5000)
    image_side: Literal["left", "right"] = "right"
    background: Literal["plain", "tint", "dark"] = "plain"
    button_label: str = Field(default="", max_length=60)
    button_url: LinkOrPath = Field(default="", max_length=500)

    @model_validator(mode="after")
    def _needs_some_text(self):
        if not self.title.strip() and not self.body.strip():
            raise ValueError("Add a heading or some text.")
        return self


class CustomSectionOut(ORMModel):
    id: int
    eyebrow: str
    title: str
    body: str
    image: str
    image_side: str
    background: str
    button_label: str
    button_url: str
