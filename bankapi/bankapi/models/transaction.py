from sqlmodel import SQLModel, Field
from datetime import datetime


class Transaction(SQLModel, table=True):
    txn_id: int = Field(ge=1)  # pk
    account_id: int = Field(ge=1)  # fk
    txm_type: str = Field(max_length=20)
    amount: float  # unique
    created_at: datetime = Field(default=datetime.now)  # errors?
