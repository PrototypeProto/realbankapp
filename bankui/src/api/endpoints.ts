/**
 * One function per API endpoint. Grouping mirrors the backend routers
 * (auth / users / accounts / transfers).
 *
 * Read endpoints accept an optional AbortSignal so useAsync can cancel a fetch
 * on unmount/refetch. Writes don't (not idempotent).
 */

import { request } from "./client";
import type {
	AccountCreate,
	AccountOut,
	AmountIn,
	LoginIn,
	MeOut,
	ObjectId,
	RegisterIn,
	RoleUpdate,
	TransactionOut,
	TransferIn,
	TransferOut,
	UserOut,
} from "./types";

export const authApi = {
	// POST /api/auth/register   first user becomes admin; sets cookies
	register: (payload: RegisterIn) =>
		request<UserOut>("/api/auth/register", { method: "POST", body: payload }),

	// POST /api/auth/login      sets cookies
	login: (payload: LoginIn) =>
		request<UserOut>("/api/auth/login", { method: "POST", body: payload }),

	// POST /api/auth/logout     clears cookies
	logout: () => request<void>("/api/auth/logout", { method: "POST" }),

	// GET  /api/auth/me         current user (rehydrates session from cookie)
	me: (signal?: AbortSignal) => request<MeOut>("/api/auth/me", { signal }),
};

export const usersApi = {
	// GET  /api/users           admin only
	list: (params?: { limit?: number; skip?: number }, signal?: AbortSignal) =>
		request<UserOut[]>(`/api/users${toQuery(params)}`, { signal }),

	// GET  /api/users/{userId}  self or admin
	get: (userId: ObjectId, signal?: AbortSignal) =>
		request<UserOut>(`/api/users/${userId}`, { signal }),

	// POST /api/users/{userId}/role   admin only
	setRole: (userId: ObjectId, payload: RoleUpdate) =>
		request<UserOut>(`/api/users/${userId}/role`, {
			method: "POST",
			body: payload,
		}),

	// GET  /api/users/{userId}/accounts   self or admin
	listAccounts: (userId: ObjectId, signal?: AbortSignal) =>
		request<AccountOut[]>(`/api/users/${userId}/accounts`, { signal }),
};

export const accountsApi = {
	// POST /api/accounts        admin only (opens for a given userId)
	create: (payload: AccountCreate) =>
		request<AccountOut>("/api/accounts", { method: "POST", body: payload }),

	// GET  /api/accounts/{accountId}   owner or admin
	get: (accountId: ObjectId, signal?: AbortSignal) =>
		request<AccountOut>(`/api/accounts/${accountId}`, { signal }),

	// POST /api/accounts/{accountId}/deposit    owner only
	deposit: (accountId: ObjectId, payload: AmountIn) =>
		request<TransactionOut>(`/api/accounts/${accountId}/deposit`, {
			method: "POST",
			body: payload,
		}),

	// POST /api/accounts/{accountId}/withdraw   owner only
	withdraw: (accountId: ObjectId, payload: AmountIn) =>
		request<TransactionOut>(`/api/accounts/${accountId}/withdraw`, {
			method: "POST",
			body: payload,
		}),

	// GET  /api/accounts/{accountId}/transactions   owner or admin
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
	// POST /api/transfers    both accounts must belong to the caller
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
