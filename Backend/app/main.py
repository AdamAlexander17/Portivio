"""FastAPI application entry point.

Run from the Backend folder:  venv\\Scripts\\python -m uvicorn app.main:app --reload
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import models  # noqa: F401  (registers the tables on Base)
from app.api.routes import api_router
from app.core import migrate
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine, ensure_database
from app.services.seed_service import seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_database()
    migrate.before_create_all(engine)
    Base.metadata.create_all(engine)
    migrate.after_create_all(engine)
    with SessionLocal() as db:
        seed(db)
    yield


settings.upload_path.mkdir(parents=True, exist_ok=True)

app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")       # never guess a file's type
    response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")           # only this site may frame its pages
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    if request.url.path.startswith("/uploads/"):
        # An uploaded file is only ever shown or downloaded; it may never run scripts or load anything.
        response.headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox"
    return response


app.include_router(api_router)
app.mount("/uploads", StaticFiles(directory=settings.upload_path), name="uploads")


@app.get("/api/health", tags=["public"])
def health():
    return {"status": "ok"}
