"""Database engine, session factory and declarative base."""
from collections.abc import Iterator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


def _url(database: str | None = None) -> URL:
    return URL.create(
        "mysql+pymysql",
        username=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        database=database,
        query={"charset": "utf8mb4"},
    )


def _connect_args() -> dict:
    """Extra driver options: an encrypted connection when DB_SSL is on."""
    if not settings.DB_SSL:
        return {}
    # Without a CA file the connection is encrypted but the server is not verified.
    return {"ssl": {"ca": settings.DB_SSL_CA} if settings.DB_SSL_CA else {"check_hostname": False}}


engine = create_engine(_url(settings.DB_NAME), pool_pre_ping=True, pool_recycle=3600, connect_args=_connect_args())
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def ensure_database() -> None:
    """Create the database itself if it does not exist yet."""
    server = create_engine(_url(), isolation_level="AUTOCOMMIT", connect_args=_connect_args())
    name = settings.DB_NAME.replace("`", "")
    with server.connect() as conn:
        conn.execute(
            text(f"CREATE DATABASE IF NOT EXISTS `{name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        )
    server.dispose()


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
