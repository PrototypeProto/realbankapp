import os
from dotenv import load_dotenv

load_dotenv()

db_user = os.getenv("MONGOUSER", "MISSING")
db_pwd = os.getenv("MONGOPASSWORD", "MISSING")

# print(db_user)
# print(db_pwd)
