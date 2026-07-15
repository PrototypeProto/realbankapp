import { useNavigate } from "react-router";
import { useCurrentUser } from "../context/CurrentUserContext";

/**
 * Compact "logged in as …" banner for the dashboard header. "Switch user" clears
 * the session and returns to Home to pick again.
 */
export function UserSwitcher() {
	const { user, clear } = useCurrentUser();
	const navigate = useNavigate();

	if (!user) return null;

	function handleSwitch() {
		clear();
		navigate("/");
	}

	return (
		<div className="user-switcher">
			<span>
				Signed in as <strong>{user.name}</strong>
			</span>
			<button onClick={handleSwitch} type="button">
				Switch user
			</button>
		</div>
	);
}
