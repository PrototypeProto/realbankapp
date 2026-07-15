from bankapi.repository.account import AccountRepository
from bankapi.repository.transaction import TransactionRepository
from bankapi.repository.user import UserRepository

user_repository = UserRepository()
account_repository = AccountRepository()
transaction_repository = TransactionRepository()

__all__ = [
    "UserRepository",
    "AccountRepository",
    "TransactionRepository",
    "user_repository",
    "account_repository",
    "transaction_repository",
]
