import re
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Reorder(BaseModel):
    ids: list[int]


class Detail(BaseModel):
    detail: str


def _http_url(value: str) -> str:
    """Allow an empty value or a plain http(s) link, so links can never run scripts."""
    value = value.strip()
    if value and not value.lower().startswith(("http://", "https://")):
        raise ValueError("Link must start with http:// or https://")
    return value


def _clean_list(values: list[str]) -> list[str]:
    return [v.strip() for v in values if v and v.strip()]


def _short_labels(values: list[str]) -> list[str]:
    """A short list of short labels (filter categories, form options): trimmed, no blanks, no repeats."""
    seen, result = set(), []
    for value in values:
        label = " ".join(str(value).split())[:40]
        if label and label.lower() not in seen:
            seen.add(label.lower())
            result.append(label)
    return result[:12]


_PART_KEY = re.compile(r"^[a-z]{2,20}\.[a-z_]{2,30}$")


def _part_keys(values: list[str]) -> list[str]:
    """Keys of the pages and page parts a site hides, such as "page.about" or "hero.photo".

    Only well-formed keys are kept; the site simply ignores a key it does not know.
    """
    seen = []
    for value in values:
        if isinstance(value, str) and _PART_KEY.match(value) and value not in seen:
            seen.append(value)
    return seen[:80]


HttpLink = Annotated[str, AfterValidator(_http_url)]
PartKeys = Annotated[list[str], AfterValidator(_part_keys)]
LabelList = Annotated[list[str], AfterValidator(_short_labels)]
StrList = Annotated[list[str], AfterValidator(_clean_list)]
