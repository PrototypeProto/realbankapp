import { ApiError } from "./client";

export interface DisplayError {
	message: string; // top-level, always present
	fields?: Record<string, string>; // field -> message, for validation errors
	kind: "network" | "validation" | "domain" | "unknown";
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

	// 3. FastAPI validation: has a `fields` array.
	if (err.code === "validation_error" && err.body?.fields) {
		const fields: Record<string, string> = {};
		for (const f of err.body.fields) {
			// field looks like "body.email" — take the last segment as the input name
			const name = f.field.split(".").pop() ?? f.field;
			fields[name] = f.message;
		}
		return {
			message: "Please fix the highlighted fields.",
			fields,
			kind: "validation",
		};
	}

	// 2. Domain error:  coded envelope.
	return { message: err.detail, kind: "domain" };
}
