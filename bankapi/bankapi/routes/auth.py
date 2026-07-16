"""Authentication endpoints: register, login, refresh, logout, me."""

from fastapi import APIRouter, Depends, Request, Response, status

from bankapi.auth.cookies import (
    REFRESH_COOKIE,
    clear_auth_cookies,
    set_auth_cookies,
)
from bankapi.auth.dependencies import get_current_user
from bankapi.auth.tokens import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from bankapi.errors import Unauthorized
from bankapi.models.user import User
from bankapi.auth.dependencies import CurrentUser
from bankapi.schemas.user import LoginIn, MeOut, RegisterIn, UserOut
from bankapi.service.user import user_service
from beanie import PydanticObjectId

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _issue(response: Response, user: User) -> None:
    """Mint both tokens and attach them as cookies. The access token snapshots
    the user's name/email/role so requests can authenticate without a DB hit."""
    access = create_access_token(str(user.id), user.name, user.email, user.role.value)
    refresh = create_refresh_token(str(user.id))
    set_auth_cookies(response, access, refresh)


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterIn, response: Response):
    """Create an account and log in immediately. First-ever user becomes admin."""
    user = await user_service.register(payload.name, payload.email, payload.password)
    _issue(response, user)
    return UserOut.from_model(user)


@router.post("/login", response_model=UserOut)
async def login(payload: LoginIn, response: Response):
    user = await user_service.authenticate(payload.email, payload.password)
    _issue(response, user)
    return UserOut.from_model(user)


@router.post("/refresh", response_model=UserOut)
async def refresh(request: Request, response: Response):
    """Exchange a valid refresh cookie for a fresh access token."""
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise Unauthorized("no refresh token")
    try:
        claims = decode_token(token, expected_type="refresh")
    except TokenError as exc:
        raise Unauthorized(str(exc)) from exc

    user = await user_service.get_user(PydanticObjectId(claims["sub"]))
    _issue(response, user)
    return UserOut.from_model(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    """Clear the cookies. (No server-side revocation in scope, so an
    already-issued token stays valid until it expires.)"""
    clear_auth_cookies(response)


@router.get("/me", response_model=MeOut)
async def me(current: CurrentUser = Depends(get_current_user)):
    """The frontend calls this on load to rehydrate the session and learn the
    user's role. Served entirely from the JWT claims — no DB read."""
    return MeOut.from_current(current)
