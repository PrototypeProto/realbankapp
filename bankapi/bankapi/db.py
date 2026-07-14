from pymongo import AsyncMongoClient
from beanie import init_beanie

from bankapi.models.user import User
from bankapi.models.account import Account
from bankapi.models.transaction import Transaction

from bankapi.config import db_pwd, db_user

URI = f"mongodb+srv://{db_user}:{db_pwd}@bankdb.4homz0h.mongodb.net/?appName=bankdb"
client = AsyncMongoClient(URI)


# joshuajar1331_db_user
# Hn2rTTYUygtZb5WC


database = client.bankdb


users_collection = database.users
accounts_collection = database.accounts
transactions_collection = database.transactions


async def init_db():

    client = AsyncMongoClient(URI)

    database = client.mybank

    await init_beanie(database=database, document_models=[User, Account, Transaction])
