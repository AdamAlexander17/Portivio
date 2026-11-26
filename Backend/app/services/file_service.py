"""Saving and deleting uploaded files (images and the resume).

Files live in the local uploads folder, or on Cloudinary when CLOUDINARY_URL is set. Either way a file is
known by the same stored path ("profile/3f2a....png"), so nothing else in the app has to care which.
"""
import logging
import re
import urllib.request
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
RESUME_EXTENSIONS = {".pdf", ".doc", ".docx"}

# The first bytes every file of a given type starts with.
_SIGNATURES = {
    ".jpg": (b"\xff\xd8\xff",),
    ".jpeg": (b"\xff\xd8\xff",),
    ".png": (b"\x89PNG\r\n\x1a\n",),
    ".gif": (b"GIF87a", b"GIF89a"),
    ".webp": (b"RIFF",),
    ".pdf": (b"%PDF",),
    ".doc": (b"\xd0\xcf\x11\xe0",),
    ".docx": (b"PK\x03\x04",),
}


log = logging.getLogger(__name__)

# A stored path: folders and a file name this module made itself.
_STORED = re.compile(r"^[a-z0-9]+(?:/[a-z0-9]+)*/[a-f0-9]{32}\.[a-z0-9]{2,5}$")


def in_cloud() -> bool:
    return bool(settings.CLOUDINARY_URL)


@lru_cache
def _cloud():
    """The Cloudinary SDK, set up once. Imported here so a local install does not need the package."""
    import cloudinary
    import cloudinary.api
    import cloudinary.uploader

    parts = urlparse(settings.CLOUDINARY_URL)
    cloudinary.config(cloud_name=parts.hostname, api_key=parts.username, api_secret=parts.password, secure=True)
    return cloudinary


def _cloud_id(relative: str) -> tuple[str, str]:
    """(public id, resource type) of a stored path. Images drop their extension; other files keep it."""
    path = f"{settings.CLOUDINARY_FOLDER}/{relative}"
    if Path(relative).suffix.lower() in IMAGE_EXTENSIONS:
        return path.rsplit(".", 1)[0], "image"
    return path, "raw"


def cloud_url(relative: str) -> str | None:
    """The public address of a stored file on Cloudinary, or None if the path is not one of ours."""
    if not relative or not _STORED.match(relative):
        return None
    kind = "image" if Path(relative).suffix.lower() in IMAGE_EXTENSIONS else "raw"
    cloud = urlparse(settings.CLOUDINARY_URL).hostname
    return f"https://res.cloudinary.com/{cloud}/{kind}/upload/{settings.CLOUDINARY_FOLDER}/{relative}"


def read(relative: str) -> bytes | None:
    """The content of a stored file, or None if there is none."""
    if not in_cloud():
        path = resolve(relative)
        return path.read_bytes() if path else None
    url = cloud_url(relative)
    if not url:
        return None
    try:
        with urllib.request.urlopen(url, timeout=30) as response:  # noqa: S310 (always https://res.cloudinary.com)
            return response.read()
    except OSError as error:
        log.warning("Could not read %s from Cloudinary: %s", relative, error)
        return None


def _save(file: UploadFile, folder: str, allowed: set[str], max_mb: int) -> str:
    extension = Path(file.filename or "").suffix.lower()
    if extension not in allowed:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"File type not allowed. Use one of: {', '.join(sorted(allowed))}",
        )

    limit = max_mb * 1024 * 1024
    data = file.file.read(limit + 1)
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The file is empty.")
    if len(data) > limit:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"File is larger than {max_mb} MB.")
    if not data.startswith(_SIGNATURES[extension]):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The file content does not match its type.")

    relative = f"{folder}/{uuid4().hex}{extension}"
    if in_cloud():
        public_id, kind = _cloud_id(relative)
        try:
            _cloud().uploader.upload(data, public_id=public_id, resource_type=kind, overwrite=True)
        except Exception as error:  # the SDK raises its own error types
            log.error("Cloudinary upload failed: %s", error)
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "The file could not be stored. Please try again.") from error
        return relative
    destination = settings.upload_path / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)
    return relative


def save_image(file: UploadFile, folder: str) -> str:
    return _save(file, folder, IMAGE_EXTENSIONS, settings.MAX_IMAGE_MB)


def save_resume(file: UploadFile) -> str:
    return _save(file, "resume", RESUME_EXTENSIONS, settings.MAX_RESUME_MB)


def resolve(relative: str) -> Path | None:
    """Return the absolute path of a stored file, or None if it is missing or outside uploads."""
    if not relative:
        return None
    root = settings.upload_path.resolve()
    path = (root / relative).resolve()
    if root not in path.parents or not path.is_file():
        return None
    return path


def delete(relative: str) -> None:
    if in_cloud():
        if relative and _STORED.match(relative):
            public_id, kind = _cloud_id(relative)
            try:
                _cloud().uploader.destroy(public_id, resource_type=kind, invalidate=True)
            except Exception as error:  # a file left behind is not worth failing the request for
                log.warning("Could not delete %s from Cloudinary: %s", relative, error)
        return
    path = resolve(relative)
    if path:
        path.unlink(missing_ok=True)


def _folder(relative: str) -> Path | None:
    root = settings.upload_path.resolve()
    path = (root / relative).resolve()
    return path if root in path.parents and path.is_dir() else None


def list_folder(relative: str) -> list[str]:
    """Stored paths of every file directly inside an uploads sub-folder."""
    if in_cloud():
        prefix = f"{settings.CLOUDINARY_FOLDER}/{relative}/"
        try:
            found = _cloud().api.resources(type="upload", resource_type="image", prefix=prefix, max_results=500)
        except Exception as error:
            log.warning("Could not list %s on Cloudinary: %s", relative, error)
            return []
        start = len(settings.CLOUDINARY_FOLDER) + 1
        return [f"{item['public_id'][start:]}.{item['format']}" for item in found.get("resources", [])]
    folder = _folder(relative)
    return [f"{relative}/{item.name}" for item in folder.iterdir() if item.is_file()] if folder else []


def delete_folder(relative: str) -> None:
    """Remove an uploads sub-folder and the files in it."""
    if in_cloud():
        for path in list_folder(relative):
            delete(path)
        return
    folder = _folder(relative)
    if not folder:
        return
    for item in folder.iterdir():
        if item.is_file():
            item.unlink(missing_ok=True)
    try:
        folder.rmdir()
    except OSError:
        pass  # not empty (unexpected sub-folder): leave it
