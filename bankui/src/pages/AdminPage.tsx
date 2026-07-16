import { useState } from "react";
import { Link } from "react-router";
import { usersApi } from "../api";
import type { UserOut } from "../api";
import { useAsync } from "../hooks/useAsync";
import { LogoutButton } from "../components/LogoutButton";
import { StatusMessage } from "../components/StatusMessage";
import { AdminOpenAccountForm } from "../components/AdminOpenAccountForm";
import { useAuth } from "../context/AuthContext";
import { useAsyncFn } from "../hooks/useAsync";

/**
 * Admin workspace: see all users, promote them to admin, and open accounts for
 * any user. Reachable only via RequireAdmin. Admins can also view any account,
 * but money movement stays owner-only (enforced by the API).
 */
export function AdminPage() {
	const { user } = useAuth();
	const selfId = user?.userId ?? null;
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
										selfId={selfId}
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
	selfId,
	onChanged,
}: {
	user: UserOut;
	selfId: string | null;
	onChanged: () => void;
}) {
	const promote = useAsyncFn(usersApi.setRole);
	const remove = useAsyncFn(usersApi.deleteUser);

	// Two-step confirms. `confirming` tracks which action is mid-confirmation so
	// only one inline prompt shows at a time.
	const [confirming, setConfirming] = useState<null | "promote" | "delete">(
		null,
	);

	const isSelf = user.userId === selfId;

	async function doPromote() {
		const updated = await promote.run(user.userId, { role: "admin" });
		if (updated) {
			setConfirming(null);
			onChanged();
		}
	}

	async function doDelete() {
		await remove.run(user.userId);
		if (!remove.error) {
			setConfirming(null);
			onChanged();
		}
	}

	return (
		<tr>
			<td>{user.name}</td>
			<td>{user.email}</td>
			<td>{user.role}</td>
			<td>
				{confirming === "delete" ? (
					<span className="confirm">
						<span className="confirm__text">Delete {user.name}?</span>
						<button
							type="button"
							className="btn-danger"
							onClick={doDelete}
							disabled={remove.loading}
						>
							{remove.loading ? "Deleting…" : "Yes"}
						</button>
						<button
							type="button"
							className="link-button"
							onClick={() => setConfirming(null)}
							disabled={remove.loading}
						>
							No
						</button>
					</span>
				) : confirming === "promote" ? (
					<span className="confirm">
						<span className="confirm__text">Make {user.name} an admin?</span>
						<button
							type="button"
							onClick={doPromote}
							disabled={promote.loading}
						>
							{promote.loading ? "…" : "Yes"}
						</button>
						<button
							type="button"
							className="link-button"
							onClick={() => setConfirming(null)}
							disabled={promote.loading}
						>
							No
						</button>
					</span>
				) : (
					<span className="row-actions">
						{/* Delete sits LEFT of Make admin, and is red. Hidden for
						    your own row (the API blocks self-deletion anyway). */}
						{!isSelf && (
							<button
								type="button"
								className="btn-danger"
								onClick={() => setConfirming("delete")}
							>
								Delete
							</button>
						)}
						{user.role !== "admin" && (
							<button type="button" onClick={() => setConfirming("promote")}>
								Make admin
							</button>
						)}
					</span>
				)}
			</td>
		</tr>
	);
}
