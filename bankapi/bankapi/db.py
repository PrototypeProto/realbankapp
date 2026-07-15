"""One client for the whole process, created on startup and closed on shutdown.
Beanie owns the collections — there are no module-level `users_collection`
handles, because two ways to touch the same data is how schemas drift."""

from beanie import init_beanie
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from bankapi.config import settings
from bankapi.models.account import Account
from bankapi.models.transaction import Transaction
from bankapi.models.user import User

_client: AsyncMongoClient | None = None

DOCUMENT_MODELS = [User, Account, Transaction]


def get_client() -> AsyncMongoClient:
    if _client is None:
        raise RuntimeError("Mongo client not initialised. Did the lifespan hook run?")
    return _client


def get_database() -> AsyncDatabase:
    return get_client()[settings.mongo_db]


async def init_db() -> None:
    global _client
    _client = AsyncMongoClient(settings.mongo_uri, tz_aware=True)
    await init_beanie(
        database=_client[settings.mongo_db], document_models=DOCUMENT_MODELS
    )


async def close_db() -> None:
    global _client
    if _client is not None:
        await _client.close()
        _client = None


async def ping() -> bool:
    await get_client().admin.command("ping")
    return True
