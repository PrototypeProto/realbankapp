from decimal import Decimal

from beanie import PydanticObjectId
from pymongo import ReturnDocument
from pymongo.asynchronous.client_session import AsyncClientSession

from bankapi.models.account import Account, AccountType
from bankapi.util.common import from_decimal128, to_decimal128, to_money


class AccountRepository:
    async def create(
        self, user_id: PydanticObjectId, account_type: AccountType
    ) -> Account:
        return await Account(user_id=user_id, account_type=account_type).insert()

    async def get(self, account_id: PydanticObjectId) -> Account | None:
        return await Account.get(account_id)

    async def list_for_user(self, user_id: PydanticObjectId) -> list[Account]:
        return await Account.find(Account.user_id == user_id).to_list()

    async def exists(self, account_id: PydanticObjectId) -> bool:
        return await Account.find_one(Account.id == account_id).exists()

    async def apply_delta(
        self,
        account_id: PydanticObjectId,
        delta: Decimal,
        *,
        session: AsyncClientSession | None = None,
    ) -> Decimal | None:
        """
        Atomically add `delta` (signed), refusing to go negative. Returns the
        new balance, or None if the account is missing OR funds are insufficient.
        """
        delta = to_money(delta)

        query: dict = {"_id": account_id}
        if delta < 0:
            query["balance"] = {"$gte": to_decimal128(-delta)}

        updated = await Account.get_pymongo_collection().find_one_and_update(
            query,
            {"$inc": {"balance": to_decimal128(delta)}},
            return_document=ReturnDocument.AFTER,
            session=session,
        )
        return from_decimal128(updated["balance"]) if updated else None
