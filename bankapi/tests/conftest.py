# tests/conftest.py
import os

# Point at the compose Mongo BEFORE importing bankapi — settings reads MONGOURI
# at import time. Assumes `docker compose up -d` is running; the compose service
# is a single-node replica set, so with_transaction works.
os.environ.setdefault("MONGOURI", "mongodb://localhost:27017/?replicaSet=rs0")
os.environ["MONGODB"] = "bankdb_test"  # throwaway DB; never the prod name

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from bankapi.db import close_db, get_database, init_db  # noqa: E402
from bankapi.main import app  # noqa: E402


@pytest.fixture(scope="session")  # no autouse
async def _db():
    assert os.environ["MONGODB"].endswith("_test"), "tests must use a *_test database"
    await init_db()
    yield
    await close_db()


@pytest.fixture  # no autouse — only DB tests request it
async def _clean(_db):
    db = get_database()
    for name in ("users", "accounts", "transactions"):
        await db[name].delete_many({})
    yield


@pytest.fixture
async def client(_clean):  # client depends on a clean DB
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c
