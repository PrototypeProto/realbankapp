from beanie import PydanticObjectId

from bankapi.auth.passwords import hash_password, verify_password
from bankapi.errors import Conflict, NotFound, Unauthorized
from bankapi.models.user import Role, User
from bankapi.repository import user_repository


class UserService:
    def __init__(self, users):
        self.users = users

    async def register(self, name: str, email: str, password: str) -> User:
        """Create a user. The first user of an empty repo
        becomes an admin; everyone after is a regular user."""
        role = Role.ADMIN if await self.users.count() == 0 else Role.USER

        if await self.users.get_by_email(email) is not None:
            raise Conflict(f"email already registered: {email}")
        return await self.users.create(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=role,
        )

    async def authenticate(self, email: str, password: str) -> User:
        user = await self.users.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise Unauthorized("invalid email or password")
        return user

    async def get_user(self, user_id: PydanticObjectId) -> User:
        user = await self.users.get(user_id)
        if user is None:
            raise NotFound(f"user {user_id} not found")
        return user

    async def set_role(self, user_id: PydanticObjectId, role: Role) -> User:
        user = await self.get_user(user_id)
        return await self.users.set_role(user, role)

    async def list_users(self, limit: int = 50, skip: int = 0) -> list[User]:
        return await self.users.get_all(limit=limit, skip=skip)


user_service = UserService(users=user_repository)
