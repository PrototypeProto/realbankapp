from fastapi import APIRouter, status

from bankapi.schemas.account import TransferIn
from bankapi.schemas.transaction import TransactionOut, TransferOut
from bankapi.service.account import account_service

router = APIRouter(prefix="/api/transfers", tags=["transfers"])


@router.post("", response_model=TransferOut, status_code=status.HTTP_201_CREATED)
async def create_transfer(payload: TransferIn):
    transfer_id, debit, credit = await account_service.transfer(
        payload.from_account_id, payload.to_account_id, payload.amount
    )
    return TransferOut(
        transfer_id=transfer_id,
        debit=TransactionOut.from_model(debit),
        credit=TransactionOut.from_model(credit),
    )
