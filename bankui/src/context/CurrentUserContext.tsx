/**
 * The "logged-in" user, app-wide. Selecting a user on the Home page sets this;
 * every screen after reads it to know whose id to use against the API. There's
 * no real auth — this is a client-side selection standing in for a session.
 *
 * In-memory only: refreshing the page clears it (by design). To make it survive
 * a refresh, seed the initial state from localStorage and write to it in
 * setUser — noted inline below.
 */

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import type { UserOut } from "../api";

interface CurrentUserContextValue {
	user: UserOut | null;
	setUser: (user: UserOut | null) => void;
	clear: () => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
	// To persist across refreshes:
	//   useState<UserOut | null>(() => {
	//     const raw = localStorage.getItem("currentUser");
	//     return raw ? JSON.parse(raw) : null;
	//   });
	const [user, setUserState] = useState<UserOut | null>(null);

	const setUser = useCallback((next: UserOut | null) => {
		setUserState(next);
	}, []);

	const clear = useCallback(() => setUser(null), [setUser]);

	const value = useMemo(
		() => ({ user, setUser, clear }),
		[user, setUser, clear],
	);

	return <CurrentUserContext value={value}>{children}</CurrentUserContext>;
}

/** Read the current user anywhere. Throws if used outside the provider. */
export function useCurrentUser(): CurrentUserContextValue {
	const ctx = useContext(CurrentUserContext);
	if (!ctx) {
		throw new Error("useCurrentUser must be used within <CurrentUserProvider>");
	}
	return ctx;
}
