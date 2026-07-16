"""FastAPI dependencies for auth.

    current: CurrentUser = Depends(get_current_user)  # any authed user
    admin:   CurrentUser = Depends(require_admin)      # admin only

get_current_user is STATELESS. Endpoints that need the full
Beanie `User` document (rare) can still load it themselves via the repository.
"""

from dataclasses import dataclass

from beanie import PydanticObjectId
from fastapi import Depends, Request

from bankapi.auth.cookies import ACCESS_COOKIE
from bankapi.auth.tokens import TokenError, decode_token
from bankapi.errors import Forbidden, Unauthorized
from bankapi.models.user import Role


@dataclass
class CurrentUser:
    """The authenticated caller, reconstructed from JWT claims. Not a DB model —
    just enough for authorization and ownership checks."""

    id: PydanticObjectId
    name: str
    email: str
    role: Role

    @property
    def is_admin(self) -> bool:
        return self.role == Role.ADMIN


async def get_current_user(request: Request) -> CurrentUser:
    """Decode the access cookie into a CurrentUser. 401 if missing/invalid"""
    token = request.cookies.get(ACCESS_COOKIE)
    if not token:
        raise Unauthorized("not authenticated")

    try:
        claims = decode_token(token, expected_type="access")
    except TokenError as exc:
        raise Unauthorized(str(exc)) from exc

    return CurrentUser(
        id=PydanticObjectId(claims["sub"]),
        name=claims["name"],
        email=claims["email"],
        role=Role(claims["role"]),
    )


async def require_admin(
    current: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """Gate for admin-only endpoints. 403 for non-admins."""
    if current.role != Role.ADMIN:
        raise Forbidden("admin role required")
    return current
