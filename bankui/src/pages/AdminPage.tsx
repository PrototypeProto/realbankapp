import { useState } from "react";
import { Link } from "react-router";
import { usersApi } from "../api";
import type { UserOut } from "../api";
import { useAsync } from "../hooks/useAsync";
import { LogoutButton } from "../components/LogoutButton";
import { StatusMessage } from "../components/StatusMessage";
import { AdminOpenAccountForm } from "../components/AdminOpenAccountForm";
import { useAsyncFn } from "../hooks/useAsync";

/**
 * Admin workspace: see all users, promote them to admin, and open accounts for
 * any user. Reachable only via RequireAdmin. Admins can also view any account,
 * but money movement stays owner-only (enforced by the API).
 */
export function AdminPage() {
	const [refresh, setRefresh] = useState(0);

	const {
		data: users,
		loading,
		error,
	} = useAsync((signal) => usersApi.list(undefined, signal), [refresh]);

	const list = users ?? [];
	const isFirstLoad = loading && list.length === 0;

	return (
		<section className="page page--admin">
			<header className="dashboard__header">
				<h1>Admin</h1>
				<div className="dashboard__header-actions">
					<Link to="/dashboard">My dashboard</Link>
					<LogoutButton />
				</div>
			</header>

			<div className="admin__grid">
				<div className="admin__users">
					<h2>Users</h2>
					<StatusMessage
						loading={isFirstLoad}
						error={error}
						empty={!loading && list.length === 0}
					>
						<table className="txn-table">
							<thead>
								<tr>
									<th>Name</th>
									<th>Email</th>
									<th>Role</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{list.map((u) => (
									<UserRow
										key={u.userId}
										user={u}
										onChanged={() => setRefresh((n) => n + 1)}
									/>
								))}
							</tbody>
						</table>
					</StatusMessage>
				</div>

				<AdminOpenAccountForm users={list} />
			</div>
		</section>
	);
}

/** One user row with a promote button. */
function UserRow({
	user,
	onChanged,
}: {
	user: UserOut;
	onChanged: () => void;
}) {
	const { run, loading } = useAsyncFn(usersApi.setRole);

	async function promote() {
		const updated = await run(user.userId, { role: "admin" });
		if (updated) onChanged();
	}

	return (
		<tr>
			<td>{user.name}</td>
			<td>{user.email}</td>
			<td>{user.role}</td>
			<td>
				{user.role !== "admin" && (
					<button type="button" onClick={promote} disabled={loading}>
						{loading ? "…" : "Make admin"}
					</button>
				)}
			</td>
		</tr>
	);
}
