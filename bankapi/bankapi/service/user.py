from datetime import datetime
from db import (
    users_collection,
    accounts_collection,
    transactions_collection,
)
from decimal import Decimal


async def create_user(name: str, email: str):

    result = await users_collection.insert_one(
        {"name": name, "email": email, "created_at": datetime.utcnow()}
    )

    return result.inserted_id


async def get_user(id: str, byEmail: bool = False):

    user = await users_collection.find_one({"email" if byEmail else "_id": id})

    return user


async def create_account(user_id: str, account_type: str):

    account = {
        "user_id": user_id,
        "balance": Decimal("0.00"),
        "account_type": account_type,
        "created_at": datetime.utcnow(),
    }

    result = await accounts_collection.insert_one(account)

    return result.inserted_id


async def create_transaction(account_id: str, txn_type: str, amount: Decimal):

    result = await transactions_collection.insert_one(
        {
            "account_id": account_id,
            "txn_type": txn_type,
            "amount": amount,
            "created_at": datetime.utcnow(),
        }
    )

    return result.inserted_id


async def deposit(account_id: str, amount: Decimal):

    await accounts_collection.update_one(
        {"_id": account_id}, {"$inc": {"balance": amount}}
    )


async def withdraw(account_id: str, amount: Decimal):

    await accounts_collection.update_one(
        {"_id": account_id}, {"$dec": {"balance": amount}}
    )
