from sqlmodel import SQLModel, Field
from datetime import datetime


class User(SQLModel, table=True):
    user_id: int = Field(ge=1)  # pk
    name: str = Field(max_length=100)
    email: str = Field(max_length=100)  # unique
    created_at: datetime = Field(default=datetime.now)  # errors?
