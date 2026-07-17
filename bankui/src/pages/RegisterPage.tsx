import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toDisplayError } from "../api";
import { useAuth } from "../context/AuthContext";
import { useAsyncFn } from "../hooks/useAsync";
import { Field } from "../components/Field";

/**
 * Register with name + email + password . The FIRST
 * user to register becomes admin
 */
export function RegisterPage() {
	const navigate = useNavigate();
	const { register } = useAuth();
	const { run, loading, error } = useAsyncFn(register);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const display = error ? toDisplayError(error) : null;

	async function handleSubmit() {
		const user = await run({ name, email, password });
		if (user) navigate("/dashboard");
	}

	return (
		<section className="page page--register">
			<div className="capsule capsule--form">
				<h1>Create an account</h1>

				<Field label="Name" htmlFor="name" error={display?.fields?.name}>
					<input
						id="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
				</Field>

				<Field label="Email" htmlFor="email" error={display?.fields?.email}>
					<input
						id="email"
						type="text"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
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
					{loading ? "Creating…" : "Create account"}
				</button>

				{display && display.kind !== "validation" && (
					<p className="status status--error" role="alert">
						{display.message}
					</p>
				)}

				<p className="muted">
					Already have an account? <Link to="/login">Sign in</Link>.
				</p>
			</div>
		</section>
	);
}
