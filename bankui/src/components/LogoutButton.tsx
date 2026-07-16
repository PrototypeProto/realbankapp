import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export function LogoutButton() {
	const { logout } = useAuth();
	const navigate = useNavigate();

	async function handleLogout() {
		await logout();
		navigate("/login");
	}

	return (
		<button type="button" className="link-button" onClick={handleLogout}>
			Log out
		</button>
	);
}
