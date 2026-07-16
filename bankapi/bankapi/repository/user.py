from beanie import PydanticObjectId
from pymongo.asynchronous.client_session import AsyncClientSession
from pymongo.errors import DuplicateKeyError

from bankapi.errors import Conflict
from bankapi.models.user import Role, User


class UserRepository:
    async def create(
        self, name: str, email: str, password_hash: str, role: Role
    ) -> User:
        user = User(
            name=name,
            email=email.lower(),
            password_hash=password_hash,
            role=role,
        )
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

    async def delete(
        self,
        user_id: PydanticObjectId,
        *,
        session: AsyncClientSession | None = None,
    ) -> None:
        user = await User.get(user_id)
        if user is not None:
            await user.delete(session=session)

    async def count(self) -> int:
        """Used to make the very first registered user an admin."""
        return await User.find_all().count()

    async def set_role(self, user: User, role: Role) -> User:
        user.role = role
        await user.save()
        return user

    async def get_all(self, limit: int = 50, skip: int = 0) -> list[User]:
        return (
            await User.find_all()
            .sort(-User.created_at)
            .skip(skip)
            .limit(limit)
            .to_list()
        )
