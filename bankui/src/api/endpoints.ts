/**
 * One function per API endpoint. This is the whole surface the UI is allowed to
 * touch — components call these, never `fetch` directly. Grouping mirrors the
 * backend routers (users / accounts / transfers).
 *
 * Read endpoints accept an optional AbortSignal so useAsync can cancel a fetch
 * on unmount/refetch. Write endpoints don't (you rarely want to abort a POST
 * that may already have moved money).
 */

import { request } from "./client";
import type {
	AccountCreate,
	AccountOut,
	AmountIn,
	ObjectId,
	TransactionOut,
	TransferIn,
	TransferOut,
	UserCreate,
	UserOut,
} from "./types";

export const usersApi = {
	// POST /api/users        201, or 409 conflict on duplicate email
	create: (payload: UserCreate) =>
		request<UserOut>("/api/users", { method: "POST", body: payload }),

	// GET  /api/users
	list: (params?: { limit?: number; skip?: number }, signal?: AbortSignal) =>
		request<UserOut[]>(`/api/users${toQuery(params)}`, { signal }),

	// GET  /api/users/{userId}
	get: (userId: ObjectId, signal?: AbortSignal) =>
		request<UserOut>(`/api/users/${userId}`, { signal }),

	// GET  /api/users/{userId}/accounts
	listAccounts: (userId: ObjectId, signal?: AbortSignal) =>
		request<AccountOut[]>(`/api/users/${userId}/accounts`, { signal }),
};

export const accountsApi = {
	// POST /api/accounts     201; user must already exist (404 otherwise)
	create: (payload: AccountCreate) =>
		request<AccountOut>("/api/accounts", { method: "POST", body: payload }),

	// GET  /api/accounts/{accountId}
	get: (accountId: ObjectId, signal?: AbortSignal) =>
		request<AccountOut>(`/api/accounts/${accountId}`, { signal }),

	// POST /api/accounts/{accountId}/deposit    201 -> the created transaction
	deposit: (accountId: ObjectId, payload: AmountIn) =>
		request<TransactionOut>(`/api/accounts/${accountId}/deposit`, {
			method: "POST",
			body: payload,
		}),

	// POST /api/accounts/{accountId}/withdraw   422 insufficient_funds if short
	withdraw: (accountId: ObjectId, payload: AmountIn) =>
		request<TransactionOut>(`/api/accounts/${accountId}/withdraw`, {
			method: "POST",
			body: payload,
		}),

	// GET  /api/accounts/{accountId}/transactions   supports ?limit=&skip=
	transactions: (
		accountId: ObjectId,
		params?: { limit?: number; skip?: number },
		signal?: AbortSignal,
	) =>
		request<TransactionOut[]>(
			`/api/accounts/${accountId}/transactions${toQuery(params)}`,
			{ signal },
		),
};

export const transfersApi = {
	// POST /api/transfers    both accounts must belong to the same user (422 else)
	create: (payload: TransferIn) =>
		request<TransferOut>("/api/transfers", { method: "POST", body: payload }),
};

// --- helpers ----------------------------------------------------------------

function toQuery(params?: Record<string, unknown>): string {
	if (!params) return "";
	const q = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (v !== undefined && v !== null) q.set(k, String(v));
	}
	const s = q.toString();
	return s ? `?${s}` : "";
}
