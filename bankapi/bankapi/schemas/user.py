from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class User(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")

    name: str
    email: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
