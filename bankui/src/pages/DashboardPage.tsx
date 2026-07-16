import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AccountList } from "../components/AccountList";

/**
 * The signed-in user's workspace.
 *
 * Regular users see their own accounts (and can deposit/withdraw/transfer via
 * the inline AccountList).
 */
export function DashboardPage() {
	const { user, isAdmin } = useAuth();
	if (!user) return null; // guard handles the redirect

	return (
		<section className="page page--dashboard">
			<h1>Welcome, {user.name}</h1>

			{isAdmin ? (
				<div className="notice">
					<p>
						You're an admin. Head to the <Link to="/admin">admin area</Link> to
						manage users and open accounts.
					</p>
				</div>
			) : (
				<AccountList />
			)}
		</section>
	);
}
