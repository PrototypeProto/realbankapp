from decimal import Decimal

from beanie import PydanticObjectId
from pymongo.asynchronous.client_session import AsyncClientSession

from bankapi.util.common import from_decimal128
from bankapi.models.transaction import Transaction, TxnType


class TransactionRepository:
    async def create(
        self,
        account_id: PydanticObjectId,
        txn_type: TxnType,
        amount: Decimal,
        balance_after: Decimal,
        *,
        transfer_id: PydanticObjectId | None = None,
        counterparty_account_id: PydanticObjectId | None = None,
        session: AsyncClientSession | None = None,
    ) -> Transaction:
        txn = Transaction(
            account_id=account_id,
            txn_type=txn_type,
            amount=amount,
            balance_after=balance_after,
            transfer_id=transfer_id,
            counterparty_account_id=counterparty_account_id,
        )
        return await txn.insert(session=session)

    async def list_for_account(
        self, account_id: PydanticObjectId, limit: int = 50, skip: int = 0
    ) -> list[Transaction]:
        # pagination. Served entirely by idx_acct_time.
        return (
            await Transaction.find(Transaction.account_id == account_id)
            .sort(-Transaction.created_at)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    async def delete_for_account(
        self,
        account_id: PydanticObjectId,
        *,
        session: AsyncClientSession | None = None,
    ) -> int:
        res = await Transaction.find(Transaction.account_id == account_id).delete(
            session=session
        )
        return res.deleted_count if res is not None else 0

    async def count_for_account(self, account_id: PydanticObjectId) -> int:
        return await Transaction.find(Transaction.account_id == account_id).count()

    async def sum_for_account(self, account_id: PydanticObjectId) -> Decimal:
        """Re-derive a balance from the ledger. Nothing in the request path calls
        this — it's how you prove the cached balance hasn't drifted."""
        credits = [TxnType.DEPOSIT, TxnType.TRANSFER_IN]
        pipeline = [
            {"$match": {"account_id": account_id}},
            {
                "$group": {
                    "_id": None,
                    "total": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$txn_type", credits]},
                                "$amount",
                                {"$multiply": ["$amount", -1]},
                            ]
                        }
                    },
                }
            },
        ]
        cursor = await Transaction.get_pymongo_collection().aggregate(pipeline)
        rows = await cursor.to_list(length=1)
        return from_decimal128(rows[0]["total"]) if rows else Decimal("0.00")
