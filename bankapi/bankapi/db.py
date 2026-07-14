from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker


DATABASE_URL = (
    "postgresql+asyncpg://databaseuser:databasepassword@localhost:5432/bankdb"
)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # logs SQL queries
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
)
