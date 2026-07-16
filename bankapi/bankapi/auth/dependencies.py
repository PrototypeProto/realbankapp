"""FastAPI dependencies for auth. Routes declare these to require a logged-in
user or an admin.

    current_user: User = Depends(get_current_user)   # any authed user
    admin: User = Depends(require_admin)
"""

from fastapi import Depends, Request
from beanie import PydanticObjectId

from bankapi.auth.cookies import ACCESS_COOKIE
from bankapi.auth.tokens import TokenError, decode_token
from bankapi.errors import Forbidden, Unauthorized
from bankapi.models.user import Role, User
from bankapi.repository import user_repository


async def get_current_user(request: Request) -> User:
    """Decode the access cookie and load the user. 401 if missing/invalid."""
    token = request.cookies.get(ACCESS_COOKIE)
    if not token:
        raise Unauthorized("not authenticated")

    try:
        claims = decode_token(token, expected_type="access")
    except TokenError as exc:
        raise Unauthorized(str(exc)) from exc

    user = await user_repository.get(PydanticObjectId(claims["sub"]))
    if user is None:
        # Token valid but user deleted since issue.
        raise Unauthorized("user no longer exists")
    return user


async def require_admin(current: User = Depends(get_current_user)) -> User:
    """Gate for admin-only endpoints. 403 for non-admins."""
    if current.role != Role.ADMIN:
        raise Forbidden("admin role required")
    return current
