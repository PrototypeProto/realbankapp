/**
 * The single choke point for talking to the API. Everything in api/endpoints.ts
 * goes through `request()`, so error handling, JSON parsing, and the base URL
 * live in exactly one place.
 */

import type { ApiErrorBody, ApiErrorCode } from "./types";

// Vite env var; set VITE_API_BASE_URL in .env. Falls back to the dev server.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

/**
 * Thrown for any non-2xx response. Carries the API's machine-readable `code`
 * so callers can branch (e.g. show a friendly message for insufficient_funds)
 * without string-matching on the human text.
 */
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

	/** The human-readable string from the API envelope (falls back to message). */
	get detail(): string {
		return this.body?.detail ?? this.message;
	}
}

interface RequestOptions {
	method?: "GET" | "POST" | "PUT" | "DELETE";
	body?: unknown;
	signal?: AbortSignal;
}

export async function request<T>(
	path: string,
	{ method = "GET", body, signal }: RequestOptions = {},
): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, {
		method,
		headers: body ? { "Content-Type": "application/json" } : undefined,
		body: body === undefined ? undefined : JSON.stringify(body),
		signal,
	});

	if (!res.ok) {
		// The API always sends the {error, detail} envelope, but guard the parse in
		// case a proxy or network layer returns something else.
		let parsed: ApiErrorBody | null = null;
		try {
			parsed = (await res.json()) as ApiErrorBody;
		} catch {
			parsed = null;
		}
		throw new ApiError(res.status, parsed);
	}

	// 204 No Content, or an empty body: nothing to parse.
	if (res.status === 204) return undefined as T;
	return (await res.json()) as T;
}
