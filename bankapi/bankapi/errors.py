"""Services raise these; main.py maps them to HTTP. Keeps services importable
from a worker, a test, or a CLI without dragging FastAPI in."""

from http import HTTPStatus


class DomainError(Exception):
    status = HTTPStatus.BAD_REQUEST
    code = "domain_error"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFound(DomainError):
    status = HTTPStatus.NOT_FOUND
    code = "not_found"


class Conflict(DomainError):
    """Uniqueness violation, e.g. duplicate email."""

    status = HTTPStatus.CONFLICT
    code = "conflict"


class InsufficientFunds(DomainError):
    status = HTTPStatus.UNPROCESSABLE_ENTITY
    code = "insufficient_funds"


class InvalidOperation(DomainError):
    status = HTTPStatus.UNPROCESSABLE_ENTITY
    code = "invalid_operation"
