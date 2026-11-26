from pydantic import BaseModel, Field

from app.schemas.common import ORMModel
from app.schemas.user import Email, Password, Username


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=255)  # username or email
    password: str = Field(min_length=1, max_length=72)


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    username: Username
    email: Email
    profession: str = Field(default="other", max_length=40)
    password: Password


class GoogleRequest(BaseModel):
    credential: str = Field(min_length=20, max_length=4096)  # the ID token Google gave the browser


class FacebookRequest(BaseModel):
    access_token: str = Field(min_length=20, max_length=2048)  # the token Facebook gave the browser


class ForgotPasswordRequest(BaseModel):
    email: Email


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=20, max_length=200)
    new_password: Password


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=72)
    new_password: Password


class AccountUpdate(BaseModel):
    email: Email


class AccountOut(ORMModel):
    id: int
    username: str
    email: str | None
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AccountOut


class SocialTokenResponse(TokenResponse):
    created: bool  # true when this sign-in made a new account


class ProfessionOption(BaseModel):
    key: str
    label: str


class AuthConfig(BaseModel):
    allow_signup: bool
    google_client_id: str  # empty when Google sign-in is switched off
    facebook_app_id: str  # empty when Facebook sign-in is switched off
    professions: list[ProfessionOption]
