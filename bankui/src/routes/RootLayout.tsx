import { Link, NavLink, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import { LogoutButton } from "../components/LogoutButton";

/**
 * status === "loading" (the initial /me check) renders no auth controls yet, so
 * the bar doesn't flicker between logged-out and logged-in on refresh.
 */
export function RootLayout() {
	const { status, isAdmin } = useAuth();
	const authed = status === "authenticated";

	return (
		<div className="app">
			<header className="navbar">
				<Link to="/" className="navbar__brand">
					銀行 Bank
				</Link>

				<nav className="navbar__links">
					<NavLink to="/about">About</NavLink>
					<NavLink to="/contact">Contact</NavLink>
					<NavLink to="/faq">FAQ</NavLink>
					{status === "loading" ? null : authed ? (
						<>
							<NavLink to="/dashboard">Dashboard</NavLink>
							{isAdmin && <NavLink to="/admin">Admin</NavLink>}
							<LogoutButton />
						</>
					) : (
						<>
							<NavLink to="/register">Register</NavLink>
							<NavLink to="/login" className="navbar__cta">
								Log in
							</NavLink>
						</>
					)}
				</nav>
			</header>

			<main className="app__main">
				<Outlet />
			</main>
		</div>
	);
}
