from decimal import Decimal

import pytest

pytestmark = [pytest.mark.asyncio, pytest.mark.integration]


async def test_withdraw_cannot_overdraw(client):
    r = await client.post("/api/users", json={"name": "a", "email": "a@x.com"})
    uid = r.json()["userId"]
    r = await client.post(
        "/api/accounts",
        json={"userId": uid, "accountType": "SAVINGS", "initialDeposit": "100.00"},
    )
    acct = r.json()["accountId"]

    r = await client.post(f"/api/accounts/{acct}/withdraw", json={"amount": 100.01})
    assert r.status_code == 422
    assert r.json()["error"] == "insufficient_funds"

    r = await client.get(f"/api/accounts/{acct}")
    assert Decimal(str(r.json()["balance"])) == Decimal("100.00")


async def test_withdraw_success(client):
    r = await client.post("/api/users", json={"name": "a", "email": "a@x.com"})
    uid = r.json()["userId"]
    r = await client.post(
        "/api/accounts",
        json={"userId": uid, "accountType": "SAVINGS", "initialDeposit": "100.00"},
    )
    acct = r.json()["accountId"]

    r = await client.post(f"/api/accounts/{acct}/withdraw", json={"amount": 100.00})
    assert r.status_code == 201

    r = await client.get(f"/api/accounts/{acct}")
    assert Decimal(str(r.json()["balance"])) == Decimal("0.00")
