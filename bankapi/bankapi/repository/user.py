from beanie import PydanticObjectId
from pymongo.errors import DuplicateKeyError

from bankapi.errors import Conflict
from bankapi.models.user import User


class UserRepository:
    async def create(self, name: str, email: str) -> User:
        user = User(name=name, email=email.lower())
        try:
            return await user.insert()
        except DuplicateKeyError as exc:
            raise Conflict(f"email already registered: {email}") from exc

    async def get(self, user_id: PydanticObjectId) -> User | None:
        return await User.get(user_id)

    async def get_by_email(self, email: str) -> User | None:
        return await User.find_one(User.email == email.lower())

    async def exists(self, user_id: PydanticObjectId) -> bool:
        return await User.find_one(User.id == user_id).exists()

    async def list(self, limit: int = 50, skip: int = 0) -> list[User]:
        return (
            await User.find_all()
            .sort(-User.created_at)
            .skip(skip)
            .limit(limit)
            .to_list()
        )
