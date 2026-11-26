"""Saving and deleting uploaded files (images and the resume)."""
from pathlib import Path
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
    path = resolve(relative)
    if path:
        path.unlink(missing_ok=True)


def _folder(relative: str) -> Path | None:
    root = settings.upload_path.resolve()
    path = (root / relative).resolve()
    return path if root in path.parents and path.is_dir() else None


def list_folder(relative: str) -> list[str]:
    """Stored paths of every file directly inside an uploads sub-folder."""
    folder = _folder(relative)
    return [f"{relative}/{item.name}" for item in folder.iterdir() if item.is_file()] if folder else []


def delete_folder(relative: str) -> None:
    """Remove an uploads sub-folder and the files in it."""
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
