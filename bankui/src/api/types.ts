/**
 * TypeScript mirror of the backend DTOs.
 *
 * These are hand-kept in sync with bankapi/openapi.json. If you change a schema
 * on the API, change it here too — or, better, generate this file from the spec
 * (see the note at the bottom) so it can't drift.
 *
 * Field names are camelCase because the API serialises that way (its Pydantic
 * models use alias_generator=to_camel). ObjectIds arrive as strings; money
 * arrives as JSON numbers (the API converts Decimal -> number at its boundary);
 * timestamps arrive as ISO-8601 strings.
 */

// A Mongo ObjectId, as it appears on the wire.
export type ObjectId = string;

// The API emits only these two today (openapi.json). CURRENT was dropped from
// the enum, so don't offer it in the UI or a create will 422.
export type AccountType = "SAVINGS" | "CHECKING";

export type TxnType = "DEPOSIT" | "WITHDRAW" | "TRANSFER_IN" | "TRANSFER_OUT";

// --- responses (what you GET back) ------------------------------------------

export interface UserOut {
	userId: ObjectId;
	name: string;
	email: string;
	createdAt: string;
}

export interface AccountOut {
	accountId: ObjectId;
	userId: ObjectId;
	userName: string; // joined in by the API; not stored on the account
	balance: number;
	accountType: AccountType;
	createdAt: string;
}

export interface TransactionOut {
	txnId: ObjectId;
	accountId: ObjectId;
	type: TxnType;
	amount: number;
	balanceAfter: number;
	date: string;
	transferId?: ObjectId | null;
	counterpartyAccountId?: ObjectId | null;
}

export interface TransferOut {
	transferId: ObjectId;
	debit: TransactionOut;
	credit: TransactionOut;
}

// --- requests (what you POST) -----------------------------------------------

export interface UserCreate {
	name: string;
	email: string;
}

export interface AccountCreate {
	userId: ObjectId;
	accountType: AccountType;
	initialDeposit?: number | string | null;
}

// Deposit and withdraw share this body.
export interface AmountIn {
	amount: number | string;
}

export interface TransferIn {
	fromAccountId: ObjectId;
	toAccountId: ObjectId;
	amount: number | string;
}

// --- error envelope ---------------------------------------------------------

/**
 * Every error the API returns has this shape (see main.py error_body):
 *   { "error": "insufficient_funds", "detail": "..." }
 * Validation failures add a `fields` array. `error` is the machine-readable
 * code you branch on; `detail` is the human string.
 */
export type ApiErrorCode =
	| "not_found"
	| "conflict"
	| "insufficient_funds"
	| "invalid_operation"
	| "validation_error"
	| "http_error"
	| "internal_error"
	| "domain_error";

export interface ApiErrorBody {
	error: ApiErrorCode | string;
	detail: string;
	fields?: Array<{ field: string; message: string; type: string }>;
}

/*
 * TODO(optional): replace this file with generated types so it never drifts.
 *   pnpm add -D openapi-typescript
 *   pnpm openapi-typescript ../bankapi/openapi.json -o src/api/schema.ts
 * Then import from schema.ts instead. Kept hand-written here so the skeleton
 * has no build step to run first.
 */
