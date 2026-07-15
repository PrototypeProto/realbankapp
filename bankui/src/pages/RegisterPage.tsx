import { useState } from "react";
import { useNavigate } from "react-router";
import { usersApi } from "../api";
import type { UserCreate } from "../api";
import { useAsyncFn } from "../hooks/useAsync";
import { useCurrentUser } from "../context/CurrentUserContext";
import { Field } from "../components/Field";
import { StatusMessage } from "../components/StatusMessage";

/**
 * Register (create a user). On success we auto-select the new user (log them in)
 * and go straight to the dashboard. 409 duplicate-email surfaces inline.
 */
export function RegisterPage() {
	const navigate = useNavigate();
	const { setUser } = useCurrentUser();
	const { run, loading, error } = useAsyncFn(usersApi.create);
	const [form, setForm] = useState<UserCreate>({ name: "", email: "" });

	async function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault();
		const user = await run(form);
		if (user) {
			setUser(user);
			navigate("/dashboard");
		}
	}

	return (
		<section className="page page--register">
			<h1>Create a user</h1>
			<form onSubmit={handleSubmit}>
				<Field label="Name" htmlFor="name">
					<input
						id="name"
						value={form.name}
						onChange={(e) => setForm({ ...form, name: e.target.value })}
					/>
				</Field>
				<Field label="Email" htmlFor="email">
					<input
						id="email"
						type="email"
						value={form.email}
						onChange={(e) => setForm({ ...form, email: e.target.value })}
					/>
				</Field>
				<button type="submit" disabled={loading}>
					{loading ? "Creating…" : "Create user"}
				</button>
			</form>
			<StatusMessage error={error} />
		</section>
	);
}
