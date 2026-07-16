from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, Query

from bankapi.auth.dependencies import CurrentUser, get_current_user, require_admin
from bankapi.errors import Forbidden
from bankapi.schemas.account import AccountOut
from bankapi.schemas.user import RoleUpdate, UserOut
from bankapi.service.account import account_service
from bankapi.service.user import user_service

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserOut])
async def list_users(
    _admin: CurrentUser = Depends(require_admin),  # admin only
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
):
    users = await user_service.list_users(limit=limit, skip=skip)
    return [UserOut.from_model(u) for u in users]


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: PydanticObjectId,
    current: CurrentUser = Depends(get_current_user),
):
    # Admin can view anyone; a user can view only themselves.
    if not current.is_admin and current.id != user_id:
        raise Forbidden("you may only view your own profile")
    return UserOut.from_model(await user_service.get_user(user_id))


@router.post("/{user_id}/role", response_model=UserOut)
async def set_role(
    user_id: PydanticObjectId,
    payload: RoleUpdate,
    _admin: CurrentUser = Depends(require_admin),  # admin only
):
    """Promote/demote a user. Admin only."""
    return UserOut.from_model(await user_service.set_role(user_id, payload.role))


@router.get("/{user_id}/accounts", response_model=list[AccountOut])
async def list_user_accounts(
    user_id: PydanticObjectId,
    current: CurrentUser = Depends(get_current_user),
):
    # Admin can view any user's accounts; a user only their own.
    if not current.is_admin and current.id != user_id:
        raise Forbidden("you may only view your own accounts")
    user = await user_service.get_user(user_id)
    accounts = await account_service.list_for_user(user_id)
    return [AccountOut.from_model(a, user_name=user.name) for a in accounts]
