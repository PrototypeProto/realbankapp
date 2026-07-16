from datetime import datetime

from beanie import PydanticObjectId
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel

from bankapi.models.user import Role, User


class CamelModel(BaseModel):
    """
    Python is snake_case. alias_generator bridges both directions (from camelCase).
    """

    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )


class UserOut(CamelModel):
    """Public shape of a user. Exclude pwd hash"""

    user_id: PydanticObjectId
    name: str
    email: EmailStr
    role: Role
    created_at: datetime

    @classmethod
    def from_model(cls, user: User) -> "UserOut":
        return cls(
            user_id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
        )


# --- auth request bodies ----------------------------------------------------


class RegisterIn(CamelModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)


class LoginIn(CamelModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class RoleUpdate(CamelModel):
    role: Role
