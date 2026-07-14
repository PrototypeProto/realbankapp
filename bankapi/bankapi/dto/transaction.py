from sqlmodel import SQLModel, Field
from datetime import datetime


class Transaction(SQLModel):
    txn_id: int | None = Field(ge=1, primary_key=True)  # pk
    account_id: int = Field(ge=1)  # fk
    txn_type: str = Field(max_length=20)
    amount: float  # unique
    created_at: datetime = Field(default=datetime.now)  # errors?
