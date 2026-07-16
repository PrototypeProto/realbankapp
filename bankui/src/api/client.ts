/**
 * The single choke point for talking to the API. Error handling, JSON parsing,
 * the base URL, cookie credentials, and access-token refresh all live here.
 */

import type { ApiErrorBody, ApiErrorCode } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
	readonly status: number;
	readonly code: ApiErrorCode | string;
	readonly body: ApiErrorBody | null;

	constructor(status: number, body: ApiErrorBody | null) {
		super(body?.detail ?? `request failed (${status})`);
		this.name = "ApiError";
		this.status = status;
		this.code = body?.error ?? "http_error";
		this.body = body;
	}

	get detail(): string {
		return this.body?.detail ?? this.message;
	}
}

interface RequestOptions {
	method?: "GET" | "POST" | "PUT" | "DELETE";
	body?: unknown;
	signal?: AbortSignal;
	// Internal: set when we've already retried after a refresh, to avoid loops.
	_retried?: boolean;
}

async function rawFetch(path: string, opts: RequestOptions): Promise<Response> {
	const { method = "GET", body, signal } = opts;
	return fetch(`${BASE_URL}${path}`, {
		method,
		headers: body ? { "Content-Type": "application/json" } : undefined,
		body: body === undefined ? undefined : JSON.stringify(body),
		signal,
		credentials: "include",
	});
}

/**
 * Attempt a token refresh. Returns true if the refresh endpoint accepted our
 * refresh cookie and minted a new access cookie. We call this once when a
 * request 401s, then retry the original request.
 */
async function tryRefresh(): Promise<boolean> {
	try {
		const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
			method: "POST",
			credentials: "include",
		});
		return res.ok;
	} catch {
		return false;
	}
}

export async function request<T>(
	path: string,
	opts: RequestOptions = {},
): Promise<T> {
	const res = await rawFetch(path, opts);

	if (res.status === 401 && !opts._retried && path !== "/api/auth/refresh") {
		// Access token likely expired.  a failed refresh returns false so we fall through to throw.
		const refreshed = await tryRefresh();
		if (refreshed) {
			return request<T>(path, { ...opts, _retried: true });
		}
	}

	if (!res.ok) {
		let parsed: ApiErrorBody | null = null;
		try {
			parsed = (await res.json()) as ApiErrorBody;
		} catch {
			parsed = null;
		}
		throw new ApiError(res.status, parsed);
	}

	if (res.status === 204) return undefined as T;
	return (await res.json()) as T;
}
