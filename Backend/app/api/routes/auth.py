from fastapi import APIRouter, BackgroundTasks, status

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.professions import profession_options
from app.core.rate_limit import rate_limit
from app.schemas.auth import (
    AccountOut, AccountUpdate, AuthConfig, ChangePasswordRequest, ForgotPasswordRequest,
    FacebookRequest, GoogleRequest, LoginRequest, RegisterRequest, ResetPasswordRequest, SocialTokenResponse, TokenResponse,
)
from app.schemas.common import Detail
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/config", response_model=AuthConfig)
def auth_config():
    """What the sign-in screen needs to know before anyone is signed in."""
    return {
        "allow_signup": settings.ALLOW_SIGNUP,
        "google_client_id": settings.GOOGLE_CLIENT_ID,
        # only when the secret is there too: the server cannot check a Facebook sign-in without it
        "facebook_app_id": settings.FACEBOOK_APP_ID if settings.FACEBOOK_APP_SECRET else "",
        "professions": profession_options(),
    }


@router.post("/login", response_model=TokenResponse, dependencies=[rate_limit("login", 30, 300)])
def login(data: LoginRequest, db: DbSession):
    service = AuthService(db)
    user = service.login(data.username, data.password)
    return {"access_token": service.token_for(user), "user": user}


@router.post(
    "/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED,
    dependencies=[rate_limit("register", 10, 3600)],
)
def register(data: RegisterRequest, db: DbSession):
    service = AuthService(db)
    user = service.register(data)
    return {"access_token": service.token_for(user), "user": user}


@router.post("/google", response_model=SocialTokenResponse, dependencies=[rate_limit("google", 30, 300)])
def google_sign_in(data: GoogleRequest, db: DbSession):
    """Sign in with Google. The first time, this also creates the account."""
    service = AuthService(db)
    user, created = service.google_sign_in(data.credential)
    return {"access_token": service.token_for(user), "user": user, "created": created}


@router.post("/facebook", response_model=SocialTokenResponse, dependencies=[rate_limit("facebook", 30, 300)])
def facebook_sign_in(data: FacebookRequest, db: DbSession):
    """Sign in with Facebook. The first time, this also creates the account."""
    service = AuthService(db)
    user, created = service.facebook_sign_in(data.access_token)
    return {"access_token": service.token_for(user), "user": user, "created": created}


def _send_reset_link(email: str) -> None:
    with SessionLocal() as db:
        AuthService(db).request_password_reset(email)


@router.post("/forgot-password", response_model=Detail, dependencies=[rate_limit("forgot", 5, 900)])
def forgot_password(data: ForgotPasswordRequest, background: BackgroundTasks):
    # Done after the response is sent, so the answer and its timing are the same
    # whether or not the address belongs to an account.
    background.add_task(_send_reset_link, data.email)
    return {"detail": "If an account uses this email, a reset link has been sent to it."}


@router.post("/reset-password", response_model=Detail, dependencies=[rate_limit("reset", 10, 900)])
def reset_password(data: ResetPasswordRequest, db: DbSession):
    AuthService(db).reset_password(data.token, data.new_password)
    return {"detail": "Password changed. You can sign in now."}


@router.get("/me", response_model=AccountOut)
def me(user: CurrentUser):
    return user


@router.put("/account", response_model=AccountOut)
def update_account(data: AccountUpdate, user: CurrentUser, db: DbSession):
    return AuthService(db).set_email(user, data.email)


@router.post("/change-password", response_model=TokenResponse, dependencies=[rate_limit("change-password", 10, 900)])
def change_password(data: ChangePasswordRequest, user: CurrentUser, db: DbSession):
    """Changes the password, signs out every other device and returns a fresh token for this one."""
    service = AuthService(db)
    service.change_password(user, data.current_password, data.new_password)
    return {"access_token": service.token_for(user), "user": user}
