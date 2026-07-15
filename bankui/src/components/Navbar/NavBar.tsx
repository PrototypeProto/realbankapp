import { NavLink } from "react-router";

/** Top-level navigation. Routes are defined in ../routes/router.tsx. */
export function NavBar() {
	return (
		<nav className="navbar">
			<NavLink to="/" end>
				Home
			</NavLink>
			<NavLink to="/users/new">Create user</NavLink>
			<NavLink to="/accounts/new">Open account</NavLink>
			<NavLink to="/transfer">Transfer</NavLink>
		</nav>
	);
}
