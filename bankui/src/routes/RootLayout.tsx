import { Link, Outlet } from "react-router";

/** App shell. Minimal top bar; the dashboard carries its own UserSwitcher. */
export function RootLayout() {
	return (
		<div className="app">
			<header className="app__bar">
				<Link to="/" className="app__brand">
					BankApp
				</Link>
			</header>
			<main className="app__main">
				<Outlet />
			</main>
		</div>
	);
}
