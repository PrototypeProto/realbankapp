from datetime import datetime
from enum import StrEnum

from beanie import DecimalAnnotation, Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

from bankapi.util.common import utcnow


class TxnType(StrEnum):
    DEPOSIT = "DEPOSIT"
    WITHDRAW = "WITHDRAW"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"


class Transaction(Document):
    """Append-only. The account balance is a cache of this ledger."""

    account_id: PydanticObjectId
    txn_type: TxnType
    amount: DecimalAnnotation  # always positive; direction is in txn_type
    balance_after: DecimalAnnotation

    transfer_id: PydanticObjectId | None = None
    counterparty_account_id: PydanticObjectId | None = None

    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "transactions"
        indexes = [
            IndexModel([("account_id", 1), ("created_at", -1)], name="idx_acct_time"),
            IndexModel([("transfer_id", 1)], name="idx_transfer"),
        ]
