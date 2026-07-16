/**
 * Authentication state, app-wide.
 *
 * - On mount, calls GET /api/auth/me. If the httpOnly cookie is valid, the
 *   session rehydrates
 * - login()/logout() call the API and update state.
 *
 * `status` distinguishes "still checking the cookie" (loading) from
 * "definitely logged out" (unauthenticated), so guards don't bounce the user
 * to /login during the initial /me check.
 */

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { authApi } from "../api";
import type { LoginIn, RegisterIn, Role, UserOut, MeOut } from "../api";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
	user: MeOut | null;
	role: Role | null;
	status: Status;
	isAdmin: boolean;
	login: (payload: LoginIn) => Promise<UserOut>;
	register: (payload: RegisterIn) => Promise<UserOut>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<MeOut | null>(null);
	const [status, setStatus] = useState<Status>("loading");

	// On first mount, ask the server who we are (via the cookie).
	useEffect(() => {
		const controller = new AbortController();
		authApi
			.me(controller.signal)
			.then((u) => {
				setUser(u);
				setStatus("authenticated");
			})
			.catch(() => {
				// 401 (no/invalid cookie) or aborted — treat as logged out.
				if (!controller.signal.aborted) {
					setUser(null);
					setStatus("unauthenticated");
				}
			});
		return () => controller.abort();
	}, []);

	const login = useCallback(async (payload: LoginIn) => {
		const u = await authApi.login(payload);
		setUser(u);
		setStatus("authenticated");
		return u;
	}, []);

	const register = useCallback(async (payload: RegisterIn) => {
		const u = await authApi.register(payload);
		setUser(u);
		setStatus("authenticated");
		return u;
	}, []);

	const logout = useCallback(async () => {
		try {
			await authApi.logout();
		} finally {
			// Clear local state even if the network call failed.
			setUser(null);
			setStatus("unauthenticated");
		}
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			role: user?.role ?? null,
			status,
			isAdmin: user?.role === "admin",
			login,
			register,
			logout,
		}),
		[user, status, login, register, logout],
	);

	return <AuthContext value={value}>{children}</AuthContext>;
}

/** Read auth state anywhere. Throws if used outside the provider. */
export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within <AuthProvider>");
	}
	return ctx;
}
