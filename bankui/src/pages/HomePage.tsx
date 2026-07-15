import { UserSelector } from "../components/UserSelector";
import { Link } from "react-router";

/**
 * Home (spec 7.1): headers + user selection. Picking a user "logs in" and
 * routes to the dashboard. No account data here by design.
 */
export function HomePage() {
	return (
		<section className="page page--home">
			<header className="home__hero">
				<h1>The Banking App</h1>
				<p>Banking with confidence.</p>
			</header>

			<UserSelector redirectTo="/dashboard" />

			<p className="home__register">
				New here? <Link to="/register">Create a user</Link>.
			</p>
		</section>
	);
}
