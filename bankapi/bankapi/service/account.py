"""Service layer (spec 5.3). Imports no FastAPI — raises domain errors and lets
the HTTP layer translate them."""

from decimal import Decimal

from beanie import PydanticObjectId
from pymongo.asynchronous.client_session import AsyncClientSession

from bankapi.config import settings
from bankapi.db import get_client
from bankapi.errors import InsufficientFunds, InvalidOperation, NotFound
from bankapi.models.account import Account, AccountType
from bankapi.util.common import to_money
from bankapi.models.transaction import Transaction, TxnType
from bankapi.repository import (
    account_repository,
    transaction_repository,
    user_repository,
)


class AccountService:
    def __init__(self, accounts, transactions, users):
        self.accounts = accounts
        self.transactions = transactions
        self.users = users

    async def _apply(
        self,
        account_id: PydanticObjectId,
        delta: Decimal,
        txn_type: TxnType,
        *,
        session: AsyncClientSession | None = None,
        transfer_id: PydanticObjectId | None = None,
        counterparty_account_id: PydanticObjectId | None = None,
    ) -> Transaction:
        """Move money and record it."""
        delta = to_money(delta)
        new_balance = await self.accounts.apply_delta(
            account_id, delta, session=session
        )

        if new_balance is None:
            # Two ways to miss the conditional update: no such account, or the
            # overdraft guard rejected us.
            if not await self.accounts.exists(account_id):
                raise NotFound(f"account {account_id} not found")
            raise InsufficientFunds(
                f"account {account_id} has insufficient funds for {abs(delta)}"
            )

        return await self.transactions.create(
            account_id=account_id,
            txn_type=txn_type,
            amount=abs(delta),
            balance_after=new_balance,
            transfer_id=transfer_id,
            counterparty_account_id=counterparty_account_id,
            session=session,
        )

    async def create_account(
        self,
        user_id: PydanticObjectId,
        account_type: AccountType,
        initial_deposit: Decimal | None = None,
    ) -> Account:
        # Mongo has no FOREIGN KEY constraint, so the service enforces it.
        if not await self.users.exists(user_id):
            raise NotFound(f"user {user_id} not found")

        account = await self.accounts.create(user_id, account_type)

        if initial_deposit:
            # Through the ledger, so the opening balance has a matching txn.
            await self.deposit(account.id, initial_deposit)
            account = await self.get_account(account.id)

        return account

    async def get_account(self, account_id: PydanticObjectId) -> Account:
        account = await self.accounts.get(account_id)
        if account is None:
            raise NotFound(f"account {account_id} not found")
        return account

    async def deposit(
        self, account_id: PydanticObjectId, amount: Decimal
    ) -> Transaction:
        return await self._apply(account_id, to_money(amount), TxnType.DEPOSIT)

    async def withdraw(
        self, account_id: PydanticObjectId, amount: Decimal
    ) -> Transaction:
        return await self._apply(account_id, -to_money(amount), TxnType.WITHDRAW)

    async def get_transactions(
        self, account_id: PydanticObjectId, limit: int = 50, skip: int = 0
    ) -> list[Transaction]:
        if not await self.accounts.exists(account_id):
            raise NotFound(f"account {account_id} not found")
        return await self.transactions.list_for_account(account_id, limit, skip)

    async def list_for_user(self, user_id: PydanticObjectId) -> list[Account]:
        if not await self.users.exists(user_id):
            raise NotFound(f"user {user_id} not found")
        return await self.accounts.list_for_user(user_id)

    # transfer between accounts

    async def transfer(
        self,
        from_account_id: PydanticObjectId,
        to_account_id: PydanticObjectId,
        amount: Decimal,
        owner_id: PydanticObjectId,
    ) -> tuple[PydanticObjectId, Transaction, Transaction]:
        """Four writes — two balances, two ledger rows — all or nothing.
        Both accounts must exist and belong to `owner_id`"""
        if from_account_id == to_account_id:
            raise InvalidOperation("cannot transfer to the same account")

        # Ownership check up front.
        source = await self.accounts.get(from_account_id)
        if source is None:
            raise NotFound(f"account {from_account_id} not found")
        dest = await self.accounts.get(to_account_id)
        if dest is None:
            raise NotFound(f"account {to_account_id} not found")

        if source.user_id != owner_id or dest.user_id != owner_id:
            raise InvalidOperation("both accounts must belong to you")

        amount = to_money(amount)
        transfer_id = PydanticObjectId()

        async def both_legs(session: AsyncClientSession | None):
            # Debit first: if the source is short we abort before crediting dest
            debit = await self._apply(
                from_account_id,
                -amount,
                TxnType.TRANSFER_OUT,
                session=session,
                transfer_id=transfer_id,
                counterparty_account_id=to_account_id,
            )
            credit = await self._apply(
                to_account_id,
                amount,
                TxnType.TRANSFER_IN,
                session=session,
                transfer_id=transfer_id,
                counterparty_account_id=from_account_id,
            )
            return debit, credit

        if not settings.use_transactions:
            # Standalone mongod can't do multi-document transactions.
            debit, credit = await both_legs(None)
            return transfer_id, debit, credit

        async with get_client().start_session() as session:
            # with_transaction commits on success, aborts on exception, and retries
            # transient / unknown-commit errors. Don't hand-roll start/commit/abort.
            debit, credit = await session.with_transaction(both_legs)

        return transfer_id, debit, credit

    # close / delete

    async def close_account(
        self,
        account_id: PydanticObjectId,
        owner_id: PydanticObjectId,
        destination_id: PydanticObjectId | None = None,
    ) -> None:
        source = await self.accounts.get(account_id)
        if source is None:
            raise NotFound(f"account {account_id} not found")
        if source.user_id != owner_id:
            raise InvalidOperation("you can only close your own account")

        balance = source.balance

        async def _do(session):
            if balance > 0:
                # Non-empty: a destination is required, and it must be yours.
                if destination_id is None:
                    raise InvalidOperation(
                        "this account has a balance; choose an account to move it to"
                    )
                if destination_id == account_id:
                    raise InvalidOperation("destination must be a different account")
                dest = await self.accounts.get(destination_id)
                if dest is None or dest.user_id != owner_id:
                    raise InvalidOperation(
                        "destination must be another of your accounts"
                    )
                await self._apply(
                    account_id,
                    -balance,
                    TxnType.TRANSFER_OUT,
                    session=session,
                    transfer_id=...,
                    counterparty_account_id=destination_id,
                )
                await self._apply(
                    destination_id,
                    balance,
                    TxnType.TRANSFER_IN,
                    session=session,
                    transfer_id=...,
                    counterparty_account_id=account_id,
                )
            # balance == 0: no sweep, no destination needed — just delete.
            await self.transactions.delete_for_account(account_id, session=session)
            await self.accounts.delete(account_id, session=session)

        if not settings.use_transactions:
            await _do(None)
            return

        async with get_client().start_session() as session:
            await session.with_transaction(_do)

    async def delete_user_cascade(self, user_id: PydanticObjectId) -> None:
        """Admin action: delete a user and ALL their accounts + transactions.
        Money is simply destroyed (no sweep) — this is a hard delete."""
        if not await self.users.exists(user_id):
            raise NotFound(f"user {user_id} not found")

        accounts = await self.accounts.list_for_user(user_id)

        async def _do(session: AsyncClientSession | None):
            for acct in accounts:
                await self.transactions.delete_for_account(acct.id, session=session)
            await self.accounts.delete_for_user(user_id, session=session)
            await self.users.delete(user_id, session=session)

        if not settings.use_transactions:
            await _do(None)
            return

        async with get_client().start_session() as session:
            await session.with_transaction(_do)


account_service = AccountService(
    accounts=account_repository,
    transactions=transaction_repository,
    users=user_repository,
)
