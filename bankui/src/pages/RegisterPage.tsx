import { useState } from "react";
import { useNavigate } from "react-router";
import { usersApi } from "../api";
import type { UserCreate } from "../api";
import { useAsyncFn } from "../hooks/useAsync";
import { useCurrentUser } from "../context/CurrentUserContext";
import { Field } from "../components/Field";
import { toDisplayError } from "../api/error";

/**
 * Register (create a user). On success we auto-select the new user (log them in)
 * and go straight to the dashboard. 409 duplicate-email surfaces inline.
 */
export function RegisterPage() {
	const navigate = useNavigate();
	const { setUser } = useCurrentUser();
	const { run, loading, error } = useAsyncFn(usersApi.create);
	const [form, setForm] = useState<UserCreate>({ name: "", email: "" });

	// Normalize once per render.
	const display = error ? toDisplayError(error) : null;

	async function handleSubmit() {
		const user = await run(form);
		if (user) {
			setUser(user);
			navigate("/dashboard");
		}
	}

	return (
		<section className="page page--register">
			<h1>Create a user</h1>

			<Field label="Name" htmlFor="name" error={display?.fields?.name}>
				<input
					id="name"
					value={form.name}
					onChange={(e) => setForm({ ...form, name: e.target.value })}
				/>
			</Field>

			<Field label="Email" htmlFor="email" error={display?.fields?.email}>
				<input
					id="email"
					// NOTE: type="text", not "email" — see below
					value={form.email}
					onChange={(e) => setForm({ ...form, email: e.target.value })}
				/>
			</Field>

			<button type="button" onClick={handleSubmit} disabled={loading}>
				{loading ? "Creating…" : "Create user"}
			</button>

			{/* Top-level message for domain/network errors (e.g. duplicate email 409,
          server unreachable). Field errors render inline above via Field. */}
			{display && display.kind !== "validation" && (
				<p className="status status--error" role="alert">
					{display.message}
				</p>
			)}
		</section>
	);
}
