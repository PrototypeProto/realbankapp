"""Integration tests for the auth + RBAC flow.

Run against a live single-node replica set:
    docker compose up -d
    uv run pytest tests/test_integration_auth.py -v

flow is:
  register admin (first user) -> register a normal user ->
  admin opens an account for that user -> the user transacts on it.

httpx.AsyncClient persists cookies across requests on the same instance, so once
a persona registers/logs in, its client carries the auth cookie automatically.
We give each persona its own client so their sessions don't clobber each other.
"""

from decimal import Decimal

import pytest
from httpx import ASGITransport, AsyncClient

from bankapi.main import app

pytestmark = [pytest.mark.asyncio, pytest.mark.integration]


def _new_client() -> AsyncClient:
    """A fresh client = a fresh cookie jar = a distinct browser session."""
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def _register(client: AsyncClient, name: str, email: str, password: str):
    """Register through the real endpoint. The response also sets the auth
    cookie on `client`, so subsequent calls on it are authenticated."""
    return await client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": password},
    )


# ---------------------------------------------------------------------------
# register / login
# ---------------------------------------------------------------------------


async def test_first_user_is_admin_and_second_is_user(_clean):
    """The very first registrant becomes admin (bootstrap); the next is a
    plain user. Also proves register sets a working session cookie."""
    async with _new_client() as admin:
        r = await _register(admin, "Boss", "boss@x.com", "password123")
        assert r.status_code == 201, r.text
        assert r.json()["role"] == "admin"
        # The cookie let us hit an authed endpoint with no extra steps.
        me = await admin.get("/api/auth/me")
        assert me.status_code == 200
        assert me.json()["email"] == "boss@x.com"

    async with _new_client() as user:
        r = await _register(user, "Normal", "normal@x.com", "password123")
        assert r.status_code == 201
        assert r.json()["role"] == "user"


async def test_login_sets_session_and_bad_password_401(_clean):
    async with _new_client() as c:
        await _register(c, "Alice", "alice@x.com", "password123")
        # Fresh client (no cookie) logs in with the same credentials.
        async with _new_client() as fresh:
            ok = await fresh.post(
                "/api/auth/login",
                json={"email": "alice@x.com", "password": "password123"},
            )
            assert ok.status_code == 200
            # Session now active on `fresh`.
            assert (await fresh.get("/api/auth/me")).status_code == 200

            bad = await fresh.post(
                "/api/auth/login",
                json={"email": "alice@x.com", "password": "wrong"},
            )
            assert bad.status_code == 401
            assert bad.json()["error"] == "unauthorized"


async def test_me_requires_authentication(_clean):
    """No cookie -> 401 from a protected endpoint."""
    async with _new_client() as anon:
        r = await anon.get("/api/auth/me")
        assert r.status_code == 401
        assert r.json()["error"] == "unauthorized"


# ---------------------------------------------------------------------------
# withdraw (the ported business-rule test, now through the auth flow)
# ---------------------------------------------------------------------------


async def test_withdraw_cannot_overdraw(_clean):
    """End-to-end: admin opens an account for a user with $100; the user cannot
    withdraw more than the balance, and a rejected withdrawal leaves it intact."""
    # Admin (first user) + a normal user, each with their own session.
    async with _new_client() as admin, _new_client() as user:
        await _register(admin, "Admin", "admin@x.com", "password123")
        ru = await _register(user, "User", "user@x.com", "password123")
        user_id = ru.json()["userId"]

        # Only the admin may open an account, and does so FOR the user.
        ra = await admin.post(
            "/api/accounts",
            json={
                "userId": user_id,
                "accountType": "SAVINGS",
                "initialDeposit": "100.00",
            },
        )
        assert ra.status_code == 201, ra.text
        acct = ra.json()["accountId"]

        # The USER (owner) attempts to overdraw -> 422, balance untouched.
        over = await user.post(
            f"/api/accounts/{acct}/withdraw", json={"amount": 100.01}
        )
        assert over.status_code == 422
        assert over.json()["error"] == "insufficient_funds"

        got = await user.get(f"/api/accounts/{acct}")
        assert Decimal(str(got.json()["balance"])) == Decimal("100.00")

        # A valid withdrawal for the full balance succeeds -> 0.00.
        ok = await user.post(f"/api/accounts/{acct}/withdraw", json={"amount": 100.00})
        assert ok.status_code == 201
        got = await user.get(f"/api/accounts/{acct}")
        assert Decimal(str(got.json()["balance"])) == Decimal("0.00")


async def test_user_cannot_withdraw_from_another_users_account(_clean):
    """RBAC ownership guard: a user withdrawing from someone else's account
    gets 403, even though the account exists and has funds."""
    async with (
        _new_client() as admin,
        _new_client() as owner,
        _new_client() as intruder,
    ):
        await _register(admin, "Admin", "admin@x.com", "password123")
        ro = await _register(owner, "Owner", "owner@x.com", "password123")
        await _register(intruder, "Eve", "eve@x.com", "password123")

        # Admin opens an account for the owner.
        ra = await admin.post(
            "/api/accounts",
            json={
                "userId": ro.json()["userId"],
                "accountType": "SAVINGS",
                "initialDeposit": "500.00",
            },
        )
        acct = ra.json()["accountId"]

        # Intruder (a valid, logged-in user) tries to withdraw -> 403.
        r = await intruder.post(f"/api/accounts/{acct}/withdraw", json={"amount": 50})
        assert r.status_code == 403
        assert r.json()["error"] == "forbidden"


async def test_user_cannot_open_account(_clean):
    """Users are not allowed to open accounts (admin-only). 403."""
    async with _new_client() as admin, _new_client() as user:
        await _register(admin, "Admin", "admin@x.com", "password123")
        ru = await _register(user, "User", "user@x.com", "password123")

        r = await user.post(
            "/api/accounts",
            json={"userId": ru.json()["userId"], "accountType": "SAVINGS"},
        )
        assert r.status_code == 403
        assert r.json()["error"] == "forbidden"
