import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { LogoutButton } from "../components/LogoutButton";
import { AccountList } from "../components/AccountList";

/**
 * The signed-in user's workspace: view their accounts and (via the inline
 * AccountList) deposit, withdraw, transfer, and see history.
 *
 * Users can NOT open their own accounts — that's admin-only, so there's no
 * OpenAccountForm here. Admins get a link to the admin area.
 */
export function DashboardPage() {
	const { user, isAdmin } = useAuth();
	if (!user) return null; // guard handles the real redirect

	return (
		<section className="page page--dashboard">
			<header className="dashboard__header">
				<span>
					Signed in as <strong>{user.name}</strong>
					{isAdmin && <span className="badge">admin</span>}
				</span>
				<div className="dashboard__header-actions">
					{isAdmin && <Link to="/admin">Admin</Link>}
					<LogoutButton />
				</div>
			</header>

			<AccountList />
		</section>
	);
}
