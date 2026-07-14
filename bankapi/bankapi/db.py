from pymongo import AsyncMongoClient
from beanie import init_beanie

from bankapi.models.user import User
from bankapi.models.account import Account
from bankapi.models.transaction import Transaction

URI = "mongodb+srv://joshuajar1331_db_user:Hn2rTTYUygtZb5WC@bankdb.4homz0h.mongodb.net"
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
