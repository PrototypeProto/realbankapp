from beanie import PydanticObjectId

from bankapi.errors import NotFound
from bankapi.models.user import User
from bankapi.repository import user_repository


class UserService:
    def __init__(self, users):
        self.users = users

    async def create_user(self, name: str, email: str) -> User:
        return await self.users.create(name, email)

    async def get_user(self, user_id: PydanticObjectId) -> User:
        user = await self.users.get(user_id)
        if user is None:
            raise NotFound(f"user {user_id} not found")
        return user

    async def list_users(self, limit: int = 50, skip: int = 0) -> list[User]:
        return await self.users.list(limit=limit, skip=skip)


user_service = UserService(users=user_repository)
