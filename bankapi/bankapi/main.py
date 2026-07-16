from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from bankapi.db import close_db, init_db, ping
from bankapi.errors import DomainError
from bankapi.routes import accounts, auth, transfers, users

from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="Simple Bank API",
    version="1.0.0",
    description="FastAPI + async MongoDB. Swagger at /docs.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def error_body(code: str, detail, **extra) -> dict:
    """One envelope for every error the API emits: {"error", "detail"}."""
    return {"error": code, "detail": detail, **extra}


@app.exception_handler(DomainError)
async def domain_error_handler(request: Request, exc: DomainError):
    """Your business failures. NotFound -> 404, Conflict -> 409, etc."""
    return JSONResponse(
        status_code=int(exc.status),
        content=error_body(exc.code, exc.message),
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    """Pydantic request-validation failures — a bad amount, a missing field,
    an unparseable ObjectId. FastAPI raises this before your route runs."""
    # exc.errors() is a list of {loc, msg, type, ...}. tells the
    # client *which* field failed
    fields = [
        {
            "field": ".".join(str(p) for p in e["loc"]),
            "message": e["msg"],
            "type": e["type"],
        }
        for e in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_body(
            "validation_error", "request validation failed", fields=fields
        ),
    )


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(request: Request, exc: StarletteHTTPException):
    """404 on an unknown route, 405 wrong method, and any raw HTTPException.
    Without this they'd keep FastAPI's default {"detail": ...} shape."""
    return JSONResponse(
        status_code=exc.status_code,
        content=error_body("http_error", exc.detail),
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    """Last resort. Anything not caught above is a bug — a 500. contains leaks
    internals (stack details, a Mongo connection string in a driver error).
    """
    import logging

    logging.getLogger("bankapi").exception("unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_body("internal_error", "an unexpected error occurred"),
    )


@app.get("/health", tags=["meta"])
async def health():
    if await ping():
        return {"status": "ok"}
    return {"status": "BAD"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(accounts.router)
app.include_router(transfers.router)
