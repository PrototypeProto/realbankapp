"""Controller layer (spec 5.4). Thin: parse, delegate, serialise. No pymongo."""

from beanie import PydanticObjectId
from fastapi import APIRouter, Query, status

from bankapi.schemas.account import AccountCreate, AccountOut, AmountIn
from bankapi.schemas.transaction import TransactionOut
from bankapi.service.account import account_service
from bankapi.service.user import user_service

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


async def _to_out(account) -> AccountOut:
    user = await user_service.get_user(account.user_id)
    return AccountOut.from_model(account, user_name=user.name)


@router.post("", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
async def create_account(payload: AccountCreate):
    """POST /api/accounts  {"userId": "...", "accountType": "SAVINGS"}"""
    user = await user_service.get_user(payload.user_id)
    account = await account_service.create_account(
        payload.user_id, payload.account_type, payload.initial_deposit
    )
    return AccountOut.from_model(account, user_name=user.name)


@router.get("/{account_id}", response_model=AccountOut)
async def get_account(account_id: PydanticObjectId):
    return await _to_out(await account_service.get_account(account_id))


@router.post(
    "/{account_id}/deposit",
    response_model=TransactionOut,
    status_code=status.HTTP_201_CREATED,
)
async def deposit(account_id: PydanticObjectId, payload: AmountIn):
    """POST /api/accounts/{id}/deposit  {"amount": 500}"""
    return TransactionOut.from_model(
        await account_service.deposit(account_id, payload.amount)
    )


@router.post(
    "/{account_id}/withdraw",
    response_model=TransactionOut,
    status_code=status.HTTP_201_CREATED,
)
async def withdraw(account_id: PydanticObjectId, payload: AmountIn):
    """POST /api/accounts/{id}/withdraw  {"amount": 200}
    422 insufficient_funds if it would overdraw (business rule 1)."""
    return TransactionOut.from_model(
        await account_service.withdraw(account_id, payload.amount)
    )


@router.get("/{account_id}/transactions", response_model=list[TransactionOut])
async def get_transactions(
    account_id: PydanticObjectId,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
):
    """GET /api/accounts/{id}/transactions  (bonus: ?limit=&skip=)"""
    txns = await account_service.get_transactions(account_id, limit=limit, skip=skip)
    return [TransactionOut.from_model(t) for t in txns]
