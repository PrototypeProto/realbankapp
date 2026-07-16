from datetime import datetime
from enum import StrEnum

from beanie import Document
from pydantic import EmailStr, Field
from pymongo import IndexModel

from bankapi.util.common import utcnow


class Role(StrEnum):
    USER = "user"
    ADMIN = "admin"


class User(Document):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password_hash: str
    role: Role = Role.USER
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "users"
        indexes = [IndexModel([("email", 1)], unique=True, name="uniq_email")]
