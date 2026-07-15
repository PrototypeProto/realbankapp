import type { ReactNode } from "react";
import { ApiError } from "../api";

/**
 * Uniform rendering for the loading / error / empty states every screen shares.
 * Wrap a screen's body in this so you write the three states once, not per page.
 */
interface StatusMessageProps {
	loading?: boolean;
	error?: ApiError | Error | null;
	empty?: boolean;
	children?: ReactNode;
}

export function StatusMessage({
	loading,
	error,
	empty,
	children,
}: StatusMessageProps) {
	if (loading) return <p className="status status--loading">Loading…</p>;

	if (error) {
		// ApiError carries the machine code; branch on it for friendlier copy.
		const message =
			error instanceof ApiError ? errorText(error) : "Something went wrong.";
		return (
			<p className="status status--error" role="alert">
				{message}
			</p>
		);
	}

	if (empty) return <p className="status status--empty">Nothing here yet.</p>;

	return <>{children}</>;
}

// expand this mapping as you design the copy for each failure.
function errorText(error: ApiError): string {
	switch (error.code) {
		case "insufficient_funds":
			return "That account doesn't have enough funds for this.";
		case "conflict":
			return "That email is already registered.";
		case "not_found":
			return "We couldn't find that.";
		case "invalid_operation":
			return error.detail; // e.g. "both accounts must belong to the same user"
		case "validation_error":
			return "Please check the highlighted fields.";
		default:
			return error.detail || "Something went wrong.";
	}
}
