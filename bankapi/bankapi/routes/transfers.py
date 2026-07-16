from fastapi import APIRouter, Depends, status

from bankapi.auth.dependencies import CurrentUser, get_current_user
from bankapi.schemas.account import TransferIn
from bankapi.schemas.transaction import TransactionOut, TransferOut
from bankapi.service.account import account_service

router = APIRouter(prefix="/api/transfers", tags=["transfers"])


@router.post("", response_model=TransferOut, status_code=status.HTTP_201_CREATED)
async def create_transfer(
    payload: TransferIn,
    current: CurrentUser = Depends(get_current_user),
):
    """Transfer between two of YOUR OWN accounts. The service rejects the
    transfer unless both accounts belong to the authenticated caller."""
    transfer_id, debit, credit = await account_service.transfer(
        payload.from_account_id,
        payload.to_account_id,
        payload.amount,
        owner_id=current.id,
    )
    return TransferOut(
        transfer_id=transfer_id,
        debit=TransactionOut.from_model(debit),
        credit=TransactionOut.from_model(credit),
    )
