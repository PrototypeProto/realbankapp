"""JWT access + refresh tokens. Both signed with the same secret (HS256).

Access token carries the user id and role, and is what protected endpoints
read. Refresh token carries only the user id and exists to mint new access
tokens.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

from bankapi.config import settings


class TokenError(Exception):
    """Raised when a token is missing, expired, or fails signature check."""


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "iat": _now(),
        "exp": _now() + timedelta(minutes=settings.access_token_ttl_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": _now(),
        "exp": _now() + timedelta(days=settings.refresh_token_ttl_days),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str, expected_type: str) -> dict[str, Any]:
    try:
        claims = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except jwt.ExpiredSignatureError as exc:
        raise TokenError("token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise TokenError("invalid token") from exc

    if claims.get("type") != expected_type:
        # An access token used where a refresh is expected, or vice versa.
        raise TokenError(f"expected {expected_type} token")
    return claims
