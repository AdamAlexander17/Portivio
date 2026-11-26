import re
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.common import HttpLink, LabelList, ORMModel, StrList

class ProjectWrite(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    category: str = Field(default="", max_length=150)
    # The site's own filter categories this project appears under (see SiteSettings.project_filters).
    platforms: LabelList = []
    summary: str = Field(default="", max_length=500)
    description: str = Field(default="", max_length=20000)
    role: str = Field(default="", max_length=150)
    client: str = Field(default="", max_length=150)
    timeline: str = Field(default="", max_length=100)
    skills: StrList = []
    live_url: HttpLink = Field(default="", max_length=500)
    case_url: HttpLink = Field(default="", max_length=500)
    is_featured: bool = False
    is_published: bool = True


# ---- Case study ------------------------------------------------------------
# A case study is a list of typed blocks, never raw HTML, so nothing a user
# writes can run as code on the page.

_YOUTUBE = re.compile(r"^https?://(?:www\.|m\.)?(?:youtube\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/)|youtu\.be/)([A-Za-z0-9_-]{11})(?:[?&#/].*)?$")
_VIMEO = re.compile(r"^https?://(?:www\.|player\.)?vimeo\.com/(?:video/)?(\d{6,12})(?:[?#/].*)?$")


class HeadingBlock(BaseModel):
    type: Literal["heading"]
    text: str = Field(min_length=1, max_length=200)


class TextBlock(BaseModel):
    type: Literal["text"]
    text: str = Field(min_length=1, max_length=6000)


class QuoteBlock(BaseModel):
    type: Literal["quote"]
    text: str = Field(min_length=1, max_length=1000)
    by: str = Field(default="", max_length=150)


class ImageBlock(BaseModel):
    type: Literal["image"]
    # Only a file uploaded for this project's case study: case/<project id>/<32 hex>.<ext>
    image: str = Field(pattern=r"^case/\d{1,10}/[0-9a-f]{32}\.(?:png|jpe?g|webp|gif)$")
    caption: str = Field(default="", max_length=255)


class VideoBlock(BaseModel):
    """A YouTube or Vimeo link. Only the video id is kept for embedding, never the pasted address."""

    type: Literal["video"]
    url: str = Field(max_length=300)
    provider: Literal["youtube", "vimeo"] | None = None
    video_id: str | None = None

    @model_validator(mode="after")
    def _extract_video(self):
        url = self.url.strip()
        for provider, pattern in (("youtube", _YOUTUBE), ("vimeo", _VIMEO)):
            match = pattern.match(url)
            if match:
                self.url, self.provider, self.video_id = url, provider, match.group(1)
                return self
        raise ValueError("Use a YouTube or Vimeo video link.")


ContentBlock = Annotated[
    HeadingBlock | TextBlock | QuoteBlock | ImageBlock | VideoBlock, Field(discriminator="type")
]


class ProjectContent(BaseModel):
    blocks: list[ContentBlock] = Field(max_length=60)


class ContentImageOut(BaseModel):
    image: str


class ProjectImageOut(ORMModel):
    id: int
    image: str
    caption: str
    sort_order: int


class ImageCaption(BaseModel):
    caption: str = Field(default="", max_length=255)


class ProjectCard(ORMModel):
    """Fields needed to draw a project card."""

    id: int
    slug: str
    title: str
    category: str
    platforms: list[str]
    summary: str
    thumbnail: str
    is_featured: bool
    is_published: bool
    sort_order: int


class ProjectDetail(ProjectCard):
    description: str
    role: str
    client: str
    timeline: str
    skills: list[str]
    live_url: str
    case_url: str
    images: list[ProjectImageOut]
    content: list[ContentBlock] = []
    created_at: datetime

    @field_validator("content", mode="before")
    @classmethod
    def _no_content_yet(cls, value):
        return value or []
