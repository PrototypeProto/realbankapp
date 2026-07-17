import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Carousel, CarouselTile } from "../components/Carousel";

import heroImage from "../assets/hero.webp";
import tileStore from "../assets/tile-store.webp";
import tileTransfer from "../assets/tile-transfer.webp";
import tileAccounts from "../assets/tile-accounts.webp";
import tileClose from "../assets/tile-close.webp";

const TILES = [
	{ src: tileStore, alt: "Secure vault", caption: "Store money safely" },
	{
		src: tileTransfer,
		alt: "Transfer between accounts",
		caption: "Make transactions between your accounts",
	},
	{ src: tileAccounts, alt: "Multiple accounts", caption: "Own many accounts" },
	{
		src: tileClose,
		alt: "Close an account",
		caption: "Close accounts whenever",
	},
];

/**
 * Public landing page: hero image, headline, a draggable feature carousel, and
 * a call-to-action. All wrapped in the shared content capsule.
 */
export function HomePage() {
	const { status } = useAuth();
	const authed = status === "authenticated";

	return (
		<section className="page page--home">
			<div className="capsule capsule--home">
				<div className="home__hero">
					<img className="home__hero-image" src={heroImage} alt="Ginkou Bank" />
					<h1>GINKOU BANK</h1>
					<p className="muted">Bank for all. Save, transfer, and withdraw.</p>
				</div>

				<Carousel>
					{TILES.map((t) => (
						<CarouselTile
							key={t.caption}
							src={t.src}
							alt={t.alt}
							caption={t.caption}
						/>
					))}
				</Carousel>

				<div className="home__cta-row">
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
			</div>
		</section>
	);
}
