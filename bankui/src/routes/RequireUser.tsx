import { Navigate } from "react-router";
import type { ReactNode } from "react";
import { useCurrentUser } from "../context/CurrentUserContext";

/**
 * Gate for pages that need a signed-in user. No user -> bounce to Home to pick
 * one. This is the client-side stand-in for an auth guard.
 */
export function RequireUser({ children }: { children: ReactNode }) {
	const { user } = useCurrentUser();
	if (!user) return <Navigate to="/" replace />;
	return <>{children}</>;
}
