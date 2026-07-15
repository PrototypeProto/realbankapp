from datetime import datetime

from beanie import PydanticObjectId

from bankapi.models.transaction import Transaction, TxnType
from bankapi.schemas.account import MoneyOut
from bankapi.schemas.user import CamelModel


class TransactionOut(CamelModel):
    """
    transaction return val
    """

    txn_id: PydanticObjectId
    account_id: PydanticObjectId
    type: TxnType
    amount: MoneyOut
    balance_after: MoneyOut
    date: datetime
    transfer_id: PydanticObjectId | None = None
    counterparty_account_id: PydanticObjectId | None = None

    @classmethod
    def from_model(cls, txn: Transaction) -> "TransactionOut":
        return cls(
            txn_id=txn.id,
            account_id=txn.account_id,
            type=txn.txn_type,
            amount=txn.amount,
            balance_after=txn.balance_after,
            date=txn.created_at,
            transfer_id=txn.transfer_id,
            counterparty_account_id=txn.counterparty_account_id,
        )


class TransferOut(CamelModel):
    transfer_id: PydanticObjectId
    debit: TransactionOut
    credit: TransactionOut
