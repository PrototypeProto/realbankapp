from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal

from bson import Decimal128

CENTS = Decimal("0.01")


def utcnow() -> datetime:
    """datetime.utcnow() is deprecated and returns a naive datetime, which then
    compares badly against anything Mongo hands back. Always use aware UTC."""
    return datetime.now(timezone.utc)


def to_money(value: Decimal) -> Decimal:
    """Quantize to 2dp — the DECIMAL(10,2) equivalent."""
    return Decimal(value).quantize(CENTS, rounding=ROUND_HALF_UP)


def to_decimal128(value: Decimal) -> Decimal128:
    """BSON has no Python-Decimal type; Mongo's decimal is Decimal128."""
    return Decimal128(to_money(value))


def from_decimal128(value: Decimal128 | Decimal) -> Decimal:
    return value.to_decimal() if isinstance(value, Decimal128) else to_money(value)
