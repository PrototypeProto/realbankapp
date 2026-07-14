from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from decimal import Decimal


class Transaction(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")

    account_id: str
    txn_type: str
    amount: Decimal
    created_at: datetime = Field(default_factory=datetime.utcnow)
