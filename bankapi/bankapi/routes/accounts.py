"""Controller layer. Thin: parse, delegate, serialise. Auth guards."""

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, Query, status

from bankapi.auth.dependencies import get_current_user, require_admin
from bankapi.errors import Forbidden
from bankapi.models.account import Account
from bankapi.models.user import Role, User
from bankapi.schemas.account import AccountCreate, AccountOut, AmountIn
from bankapi.schemas.transaction import TransactionOut
from bankapi.service.account import account_service
from bankapi.service.user import user_service

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


def _is_admin(user: User) -> bool:
    return user.role == Role.ADMIN


async def _load_owned(account_id: PydanticObjectId, current: User) -> Account:
    """Fetch an account and enforce that `current` may READ it (owner or admin).
    Raises 404 if missing, 403 if not permitted."""
    account = await account_service.get_account(account_id)  # 404 if missing
    if not _is_admin(current) and account.user_id != current.id:
        raise Forbidden("you do not own this account")
    return account


async def _require_own(account_id: PydanticObjectId, current: User) -> Account:
    """Like _load_owned but for WRITES (deposit/withdraw): owner ONLY — admins
    may view but not move other people's money."""
    account = await account_service.get_account(account_id)
    if account.user_id != current.id:
        raise Forbidden("you may only transact on your own account")
    return account


async def _to_out(account: Account) -> AccountOut:
    user = await user_service.get_user(account.user_id)
    return AccountOut.from_model(account, user_name=user.name)


@router.post("", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
async def create_account(
    payload: AccountCreate,
    _admin: User = Depends(require_admin),
):
    """POST /api/accounts  {"userId": "...", "accountType": "SAVINGS"}
    Admin only — users cannot open their own accounts."""
    user = await user_service.get_user(payload.user_id)
    account = await account_service.create_account(
        payload.user_id, payload.account_type, payload.initial_deposit
    )
    return AccountOut.from_model(account, user_name=user.name)


@router.get("/{account_id}", response_model=AccountOut)
async def get_account(
    account_id: PydanticObjectId,
    current: User = Depends(get_current_user),
):
    return await _to_out(await _load_owned(account_id, current))


@router.post(
    "/{account_id}/deposit",
    response_model=TransactionOut,
    status_code=status.HTTP_201_CREATED,
)
async def deposit(
    account_id: PydanticObjectId,
    payload: AmountIn,
    current: User = Depends(get_current_user),
):
    await _require_own(account_id, current)  # owner only
    return TransactionOut.from_model(
        await account_service.deposit(account_id, payload.amount)
    )


@router.post(
    "/{account_id}/withdraw",
    response_model=TransactionOut,
    status_code=status.HTTP_201_CREATED,
)
async def withdraw(
    account_id: PydanticObjectId,
    payload: AmountIn,
    current: User = Depends(get_current_user),
):
    await _require_own(account_id, current)  # owner only
    return TransactionOut.from_model(
        await account_service.withdraw(account_id, payload.amount)
    )


@router.get("/{account_id}/transactions", response_model=list[TransactionOut])
async def get_transactions(
    account_id: PydanticObjectId,
    current: User = Depends(get_current_user),
    limit: int = Query(15, ge=1, le=25),
    skip: int = Query(0, ge=0),
):
    await _load_owned(account_id, current)  # owner or admin may view
    txns = await account_service.get_transactions(account_id, limit=limit, skip=skip)
    return [TransactionOut.from_model(t) for t in txns]
