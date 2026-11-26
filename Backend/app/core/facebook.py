"""Checking a "Continue with Facebook" sign-in.

The browser gets an access token from Facebook and sends it here. It is only trusted after
Facebook confirms it was issued for OUR app and is still valid; then the person's id, name and
email are read with it.
"""
import json
import urllib.error
import urllib.parse
import urllib.request

from fastapi import HTTPException, status

from app.core.config import settings

GRAPH = "https://graph.facebook.com/v19.0"


def _get(path: str, **params) -> dict:
    url = f"{GRAPH}{path}?{urllib.parse.urlencode(params)}"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as error:
        # Facebook answers 400 with details for a bad token.
        try:
            return json.loads(error.read())
        except ValueError:
            return {"error": {"message": "unreadable answer"}}
    except (urllib.error.URLError, TimeoutError, ValueError):
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Facebook could not be reached. Please try again.") from None


def verify_facebook_token(access_token: str) -> dict:
    """The person behind a Facebook access token: {"id", "name", "email"}."""
    if not settings.FACEBOOK_APP_ID or not settings.FACEBOOK_APP_SECRET:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Facebook sign-in is not set up on this site.")
    rejected = HTTPException(status.HTTP_401_UNAUTHORIZED, "Facebook sign-in could not be verified. Please try again.")

    # 1. Was this token really issued for our app, and is it still valid?
    app_token = f"{settings.FACEBOOK_APP_ID}|{settings.FACEBOOK_APP_SECRET}"
    checked = _get("/debug_token", input_token=access_token, access_token=app_token).get("data") or {}
    if not checked.get("is_valid") or str(checked.get("app_id")) != settings.FACEBOOK_APP_ID or not checked.get("user_id"):
        raise rejected

    # 2. Who is it?
    person = _get("/me", fields="id,name,email", access_token=access_token)
    if "error" in person or str(person.get("id")) != str(checked["user_id"]):
        raise rejected
    if not person.get("email"):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Facebook did not share an email address. Allow the email permission, or sign up with your email instead.",
        )
    return {"id": str(person["id"]), "name": str(person.get("name") or ""), "email": str(person["email"])}
