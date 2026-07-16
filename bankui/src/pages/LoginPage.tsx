import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toDisplayError } from "../api";
import { useAuth } from "../context/AuthContext";
import { useAsyncFn } from "../hooks/useAsync";
import { Field } from "../components/Field";

/**
 * Email + password login. On success the AuthContext holds the user and we go
 * to the dashboard.
 */
export function LoginPage() {
	const navigate = useNavigate();
	const { login } = useAuth();
	const { run, loading, error } = useAsyncFn(login);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const display = error ? toDisplayError(error) : null;

	async function handleSubmit() {
		const user = await run({ email, password });
		if (user) navigate("/dashboard");
	}

	return (
		<section className="page page--login">
			<h1>Sign in</h1>

			<Field label="Email" htmlFor="email" error={display?.fields?.email}>
				<input
					id="email"
					type="text"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
				/>
			</Field>

			<Field
				label="Password"
				htmlFor="password"
				error={display?.fields?.password}
			>
				<input
					id="password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
				/>
			</Field>

			<button type="button" onClick={handleSubmit} disabled={loading}>
				{loading ? "Signing in…" : "Sign in"}
			</button>

			{display && display.kind !== "validation" && (
				<p className="status status--error" role="alert">
					{display.message}
				</p>
			)}

			<p className="muted">
				No account? <Link to="/register">Register</Link>.
			</p>
		</section>
	);
}
