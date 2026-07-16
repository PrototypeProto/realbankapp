import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";

/**
 * Bare public landing page.
 */
export function HomePage() {
	const { status } = useAuth();
	const authed = status === "authenticated";

	return (
		<section className="page page--home">
			<div className="home__hero">
				<h1>GINKOU BANK</h1>
				<p className="muted">Bank for all. Save, transfer, and withdraw.</p>

				{status === "loading" ? null : authed ? (
					<Link to="/dashboard" className="home__cta">
						Go to dashboard
					</Link>
				) : (
					<Link to="/login" className="home__cta">
						Log in to get started
					</Link>
				)}
			</div>
		</section>
	);
}
