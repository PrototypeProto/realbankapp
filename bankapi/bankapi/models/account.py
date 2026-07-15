from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from beanie import DecimalAnnotation, Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

from bankapi.util.common import utcnow


class AccountType(StrEnum):
    SAVINGS = "SAVINGS"
    CHECKING = "CHECKING"
    CURRENT = "CURRENT"


class Account(Document):
    user_id: PydanticObjectId

    # DecimalAnnotation is Beanie's Decimal <-> BSON Decimal128 bridge.
    balance: DecimalAnnotation = Decimal("0.00")
    account_type: AccountType
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "accounts"
        indexes = [IndexModel([("user_id", 1)], name="idx_user_id")]
