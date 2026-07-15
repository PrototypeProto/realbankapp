import { useState } from "react";
import { useNavigate } from "react-router";
import { usersApi } from "../api";
import type { UserCreate } from "../api";
import { useAsyncFn } from "../hooks/useAsync";
import { Field } from "../components/Field";
import { StatusMessage } from "../components/StatusMessage";

/**
 * Create a user (POST /api/users). We keep users and accounts separate — this
 * only makes the user; opening an account is its own screen that takes the
 * resulting userId. 409 on a duplicate email surfaces via StatusMessage.
 */
export function CreateUserPage() {
	const navigate = useNavigate();
	const { run, loading, error } = useAsyncFn(usersApi.create);

	// TODO: controlled inputs + validation. Placeholder state shown.
	const [form, setForm] = useState<UserCreate>({ name: "", email: "" });

	async function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault();
		const user = await run(form);
		if (user) {
			// TODO: go where it makes sense — maybe straight into opening an account
			// for this new user.
			navigate(`/accounts/new?userId=${user.userId}`);
		}
	}

	return (
		<section className="page page--create-user">
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

			{/* Shows the 409/validation message; nothing on success (we navigate). */}
			<StatusMessage error={error} />
		</section>
	);
}
