from datetime import datetime
from decimal import Decimal
from typing import Annotated

from beanie import PydanticObjectId
from pydantic import Field, PlainSerializer

from bankapi.models.account import Account, AccountType
from bankapi.schemas.user import CamelModel

MoneyIn = Annotated[
    Decimal,
    Field(gt=Decimal("0"), le=Decimal("99999999.99"), decimal_places=2),
]

#  convert only at the wire boundary.
MoneyOut = Annotated[
    Decimal,
    PlainSerializer(float, return_type=float, when_used="json"),
]


class AccountCreate(CamelModel):
    """
    The user must already exist. create them via POST /api/users first.
    """

    user_id: PydanticObjectId
    account_type: AccountType
    initial_deposit: MoneyIn | None = None


class AccountOut(CamelModel):
    """
    userName is joined in at read time because the Account Details screen shows
    it, and a second round-trip for one string is silly.
    """

    account_id: PydanticObjectId
    user_id: PydanticObjectId
    user_name: str
    balance: MoneyOut
    account_type: AccountType
    created_at: datetime

    @classmethod
    def from_model(cls, account: Account, user_name: str) -> "AccountOut":
        return cls(
            account_id=account.id,
            user_id=account.user_id,
            user_name=user_name,
            balance=account.balance,
            account_type=account.account_type,
            created_at=account.created_at,
        )


class AmountIn(CamelModel):
    """Body for deposit / withdraw: {"amount": 500}"""

    amount: MoneyIn


class TransferIn(CamelModel):
    from_account_id: PydanticObjectId
    to_account_id: PydanticObjectId
    amount: MoneyIn
