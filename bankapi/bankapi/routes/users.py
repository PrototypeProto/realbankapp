from beanie import PydanticObjectId
from fastapi import APIRouter, Query, status

from bankapi.schemas.account import AccountOut
from bankapi.schemas.user import UserCreate, UserOut
from bankapi.service.account import account_service
from bankapi.service.user import user_service

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate):
    """409 on a duplicate email (the users.email UNIQUE constraint)."""
    return UserOut.from_model(
        await user_service.create_user(payload.name, payload.email)
    )


@router.get("", response_model=list[UserOut])
async def list_users(limit: int = Query(50, ge=1, le=100), skip: int = Query(0, ge=0)):
    users = await user_service.list_users(limit=limit, skip=skip)
    return [UserOut.from_model(u) for u in users]


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: PydanticObjectId):
    return UserOut.from_model(await user_service.get_user(user_id))


@router.get("/{user_id}/accounts", response_model=list[AccountOut])
async def list_user_accounts(user_id: PydanticObjectId):
    user = await user_service.get_user(user_id)
    accounts = await account_service.list_for_user(user_id)
    return [AccountOut.from_model(a, user_name=user.name) for a in accounts]
