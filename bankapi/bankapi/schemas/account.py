from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal


class Account(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")

    user_id: str
    balance: Decimal = Decimal("0.00")
    account_type: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
