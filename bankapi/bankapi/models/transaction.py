from datetime import datetime
from decimal import Decimal

from beanie import Document, PydanticObjectId
from pydantic import Field


class Transaction(Document):
    account_id: PydanticObjectId
    txn_type: str
    amount: Decimal
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "transactions"
