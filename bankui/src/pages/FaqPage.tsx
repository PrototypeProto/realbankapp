export function FaqPage() {
	return (
		<section className="page page--static">
			<div className="capsule">
				<h1>FAQ</h1>

				<h2>What can I do in this app?</h2>
				<p>
					You can register, log in, view your accounts, transfer money between
					accounts, and review transaction history. To open an account, an admin
					must open an account for you.
				</p>

				<h2>Can admins do more?</h2>
				<p>
					Yes. Admin users can view users, manage roles, and open accounts for
					customers.
				</p>

				<h2>Is this a production banking platform?</h2>
				<p>
					No. This project is intended for demonstration and educational use.
				</p>

				<h2>Tech stack?</h2>
				<p>Backend: Python with FastAPI and served with Caddy</p>
				<p>Database: MongoDB</p>
				<p>Frontend: React + TypeScript, built using Vite</p>
				<p>
					Services used: AWS EC2 hosts the backend, S3 hosts the frontend files,
					Cloudfront to serves the files publicly, and MongoDB Atlas for
					database provider.
				</p>
			</div>
		</section>
	);
}
