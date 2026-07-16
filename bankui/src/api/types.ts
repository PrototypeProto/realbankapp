/**
 * TypeScript mirror of the backend DTOs. Kept in sync with bankapi/openapi.json.
 *
 * camelCase because the API serialises that way (alias_generator=to_camel).
 * ObjectIds are strings; money is a JSON number; timestamps are ISO-8601.
 */

export type ObjectId = string;

export type AccountType = "SAVINGS" | "CHECKING";

export type TxnType = "DEPOSIT" | "WITHDRAW" | "TRANSFER_IN" | "TRANSFER_OUT";

export type Role = "user" | "admin";

// --- responses --------------------------------------------------------------

export interface UserOut {
	userId: ObjectId;
	name: string;
	email: string;
	role: Role;
	createdAt: string;
}

export interface MeOut {
	userId: ObjectId;
	name: string;
	email: string;
	role: Role;
}

export interface AccountOut {
	accountId: ObjectId;
	userId: ObjectId;
	userName: string;
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

// --- requests ---------------------------------------------------------------

export interface RegisterIn {
	name: string;
	email: string;
	password: string;
}

export interface LoginIn {
	email: string;
	password: string;
}

export interface RoleUpdate {
	role: Role;
}

export interface AccountCreate {
	userId: ObjectId;
	accountType: AccountType;
	initialDeposit?: number | string | null;
}

export interface AmountIn {
	amount: number | string;
}

export interface TransferIn {
	fromAccountId: ObjectId;
	toAccountId: ObjectId;
	amount: number | string;
}

// --- error envelope ---------------------------------------------------------

export type ApiErrorCode =
	| "not_found"
	| "conflict"
	| "insufficient_funds"
	| "invalid_operation"
	| "validation_error"
	| "unauthorized"
	| "forbidden"
	| "http_error"
	| "internal_error"
	| "domain_error";

export interface ApiErrorBody {
	error: ApiErrorCode | string;
	detail: string;
	fields?: Array<{ field: string; message: string; type: string }>;
}
