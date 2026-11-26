"""Application settings, loaded from Backend/.env."""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    APP_NAME: str = "Portfolio API"

    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "Profile_db"
    # Hosted databases (Aiven, TiDB Cloud...) only accept encrypted connections: set DB_SSL=true there.
    # DB_SSL_CA is the path of the provider's CA certificate; with it the server is also verified.
    DB_SSL: bool = False
    DB_SSL_CA: str = ""

    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720

    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = ""

    CORS_ORIGINS: str = "http://localhost:5173"

    # Accounts
    ALLOW_SIGNUP: bool = True                      # may visitors create their own account?
    FRONTEND_URL: str = "http://localhost:5173"    # used to build links sent by email
    RESET_TOKEN_MINUTES: int = 60
    # "Continue with Google": the OAuth client ID from Google Cloud Console. Empty switches it off.
    GOOGLE_CLIENT_ID: str = ""
    # "Continue with Facebook": the app ID and app secret from developers.facebook.com. Empty switches it off.
    FACEBOOK_APP_ID: str = ""
    FACEBOOK_APP_SECRET: str = ""

    # Email (password reset). Without SMTP_HOST the message is printed in the server log instead.
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""

    UPLOAD_DIR: str = "uploads"
    # Where uploads are kept. Empty: the UPLOAD_DIR folder on this machine. On a host whose disk is wiped
    # on every restart (Render's free plan), set it to the "cloudinary://key:secret@cloud" line from the
    # Cloudinary dashboard and files are stored there instead.
    CLOUDINARY_URL: str = ""
    CLOUDINARY_FOLDER: str = "portivio"
    MAX_IMAGE_MB: int = 8
    MAX_RESUME_MB: int = 10

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def upload_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        return path if path.is_absolute() else BASE_DIR / path


settings = Settings()
