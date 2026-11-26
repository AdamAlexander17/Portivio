"""Checking a "Sign in with Google" credential.

The browser gets a signed ID token from Google and sends it here. It is only trusted after
its signature (Google's public keys), audience (our client ID), issuer and expiry are checked.
"""
import jwt
from fastapi import HTTPException, status
from jwt import PyJWKClient, PyJWKClientError

from app.core.config import settings

GOOGLE_ISSUERS = {"https://accounts.google.com", "accounts.google.com"}
# Google's public signing keys; fetched when needed and kept for an hour.
_keys = PyJWKClient("https://www.googleapis.com/oauth2/v3/certs", cache_keys=True, lifespan=3600, timeout=10)


def verify_google_credential(credential: str) -> dict:
    """The verified claims of a Google ID token: sub, email, email_verified, name…"""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Google sign-in is not set up on this site.")
    rejected = HTTPException(status.HTTP_401_UNAUTHORIZED, "Google sign-in could not be verified. Please try again.")
    try:
        key = _keys.get_signing_key_from_jwt(credential)
        claims = jwt.decode(
            credential, key.key, algorithms=["RS256"], audience=settings.GOOGLE_CLIENT_ID,
            options={"require": ["exp", "iat", "sub", "aud", "iss"]}, leeway=30,
        )
    except PyJWKClientError as error:
        # Either the token names no known key, or Google's keys could not be fetched.
        if "Unable to find a signing key" in str(error) or "kid" in str(error):
            raise rejected from None
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Google could not be reached. Please try again.") from None
    except jwt.PyJWTError:
        raise rejected from None
    if claims.get("iss") not in GOOGLE_ISSUERS:
        raise rejected
    if not claims.get("email") or claims.get("email_verified") not in (True, "true"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Your Google account has no verified email address.")
    return claims
