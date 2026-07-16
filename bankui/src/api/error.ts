import { ApiError } from "./client";

export interface DisplayError {
	message: string; // top-level, always present
	fields?: Record<string, string>; // field -> message, for validation errors
	kind: "network" | "validation" | "domain" | "auth" | "unknown";
}

export function toDisplayError(err: unknown): DisplayError {
	// 1. Network / JS-side: fetch threw before any response.
	if (!(err instanceof ApiError)) {
		const message =
			err instanceof Error && err.message.includes("fetch")
				? "Can't reach the server. Check your connection and try again."
				: err instanceof Error
					? err.message
					: "Something went wrong.";
		return { message, kind: "network" };
	}

	// FastAPI validation: has a `fields` array.
	if (err.code === "validation_error" && err.body?.fields) {
		const fields: Record<string, string> = {};
		for (const f of err.body.fields) {
			const name = f.field.split(".").pop() ?? f.field;
			fields[name] = f.message;
		}
		return {
			message: "Please fix the highlighted fields.",
			fields,
			kind: "validation",
		};
	}

	// Auth failures — surfaced distinctly so pages can, e.g., redirect to login.
	if (err.code === "unauthorized" || err.code === "forbidden") {
		return { message: err.detail, kind: "auth" };
	}

	// Domain error: coded envelope.
	return { message: err.detail, kind: "domain" };
}
