import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

/**
 * Gate for any authenticated page. While the initial /me check is in flight we
 * render nothing (avoids a flash of the login page for already-logged-in users
 * on refresh). Only bounce once we're *certain* they're logged out.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
	const { status } = useAuth();
	if (status === "loading") return <p className="status">Loading…</p>;
	if (status === "unauthenticated") return <Navigate to="/login" replace />;
	return <>{children}</>;
}

/**
 * Gate for admin-only pages. Logged-out -> login; logged-in non-admin -> home
 * (they're authenticated, just not allowed here).
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
	const { status, isAdmin } = useAuth();
	if (status === "loading") return <p className="status">Loading…</p>;
	if (status === "unauthenticated") return <Navigate to="/login" replace />;
	if (!isAdmin) return <Navigate to="/dashboard" replace />;
	return <>{children}</>;
}
