from sqlmodel import SQLModel, Field
from datetime import datetime


class Account(SQLModel, table=True):
    account_id: int = Field(ge=1)  # refers to user
    user_id: int = Field(ge=1)
    balance: int = Field(ge=0)
    account_type: str = Field(max_length=50)
    created_at: datetime = Field(default=datetime.now)  # errors?
