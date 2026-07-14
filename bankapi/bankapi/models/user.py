from datetime import datetime

from beanie import Document
from pydantic import Field
from pymongo import IndexModel


class User(Document):
    name: str
    email: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        indexes = [IndexModel([("email", 1)], unique=True)]
