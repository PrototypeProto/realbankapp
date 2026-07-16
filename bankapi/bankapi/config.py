from functools import lru_cache
from urllib.parse import quote_plus

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Set MONGOURI to bypass the SRV builder — needed for a local container
    # (mongodb://bank-db-dev:27017/?replicaSet=rs0), since +srv only resolves
    # against DNS seedlists like Atlas.
    mongo_uri_override: str | None = Field(default=None, alias="MONGOURI")

    mongo_user: str = Field(default="", alias="MONGOUSER")
    mongo_password: str = Field(default="", alias="MONGOPASSWORD")
    mongo_host: str = Field(default="", alias="MONGOHOST")
    mongo_db: str = Field(default="", alias="MONGODB")
    app_name: str = Field(default="", alias="MONGOAPPNAME")

    # --- auth / JWT ---
    jwt_secret: str = Field(default="MISSING_SECRET", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_ttl_minutes: int = Field(default=15, alias="ACCESS_TOKEN_TTL_MINUTES")
    refresh_token_ttl_days: int = Field(default=7, alias="REFRESH_TOKEN_TTL_DAYS")
    cookie_secure: bool = Field(default=False, alias="COOKIE_SECURE")
    cookie_samesite: str = Field(default="lax", alias="COOKIE_SAMESITE")

    # Multi-document transactions need a replica set. Atlas is one.
    use_transactions: bool = Field(default=True, alias="USE_TRANSACTIONS")

    @property
    def mongo_uri(self) -> str:
        if self.mongo_uri_override:
            return self.mongo_uri_override
        if not (self.mongo_user and self.mongo_password):
            raise ValueError("set MONGOURI, or both MONGOUSER and MONGOPASSWORD")
        user = quote_plus(self.mongo_user)  # passwords with @ : / would
        pwd = quote_plus(self.mongo_password)  # otherwise corrupt the URI
        return f"mongodb+srv://{user}:{pwd}@{self.mongo_host}/?appName={self.app_name}"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
