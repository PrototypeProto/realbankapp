import { useNavigate } from "react-router";
import { usersApi } from "../api";
import type { UserOut } from "../api";
import { useAsync } from "../hooks/useAsync";
import { useCurrentUser } from "../context/CurrentUserContext";
import { StatusMessage } from "./StatusMessage";

/**
 * Dropdown of every user (GET /api/users). Choosing one "logs in" as that user
 * and, unless `redirectTo` is null, sends them to the dashboard. Used on the
 * Home page and (compactly) in the dashboard's UserSwitcher.
 */
interface UserSelectorProps {
	redirectTo?: string | null; // where to go after selecting; default /dashboard
}

export function UserSelector({ redirectTo = "/dashboard" }: UserSelectorProps) {
	const navigate = useNavigate();
	const { user, setUser } = useCurrentUser();
	const {
		data: users,
		loading,
		error,
	} = useAsync((signal) => usersApi.list(undefined, signal), []);

	function handleChange(userId: string) {
		const picked = users?.find((u) => u.userId === userId) ?? null;
		setUser(picked);
		if (picked && redirectTo) navigate(redirectTo);
	}

	return (
		<div className="user-selector">
			<StatusMessage loading={loading} error={error}>
				<label htmlFor="user-select">Select a user</label>
				<select
					id="user-select"
					value={user?.userId ?? ""}
					onChange={(e) => handleChange(e.target.value)}
				>
					<option value="" disabled>
						— choose —
					</option>
					{(users ?? []).map((u: UserOut) => (
						<option key={u.userId} value={u.userId}>
							{u.name} ({u.email})
						</option>
					))}
				</select>
			</StatusMessage>
		</div>
	);
}
