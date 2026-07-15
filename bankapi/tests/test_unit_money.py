# tests/test_unit_money.py — no DB, no container, runs in milliseconds
from decimal import Decimal

import pytest
from pydantic import ValidationError

from bankapi.util.common import to_money
from bankapi.schemas.account import AmountIn

pytestmark = pytest.mark.unit


def test_to_money_rounds_half_up():
    assert to_money(Decimal("10.005")) == Decimal("10.01")


@pytest.mark.parametrize("bad", [0, -50, "10.999"])
def test_amount_rejects_invalid(bad):
    with pytest.raises(ValidationError):
        AmountIn(amount=bad)
