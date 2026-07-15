import { useState } from "react";
import { usersApi } from "../api";
import type { AccountOut } from "../api";
import { useAsync } from "../hooks/useAsync";
import { useCurrentUser } from "../context/CurrentUserContext";
import { Money } from "./Money";
import { StatusMessage } from "./StatusMessage";
import { AccountPanel } from "./AccountPanel";

/**
 * The logged-in user's accounts (GET /api/users/{id}/accounts). Clicking a row
 * expands its AccountPanel inline beneath it. Exposes a `reloadKey` refresh via
 * the parent so opening a new account re-lists.
 *
 * `refreshSignal` — bump this number from the parent (e.g. after OpenAccountForm
 * succeeds) to force a re-fetch of the list.
 */
interface AccountListProps {
	refreshSignal?: number;
}

export function AccountList({ refreshSignal = 0 }: AccountListProps) {
	const { user } = useCurrentUser();
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const {
		data: accounts,
		loading,
		error,
		reload,
	} = useAsync(
		(signal) => usersApi.listAccounts(user!.userId, signal),
		[user?.userId, refreshSignal],
	);

	const list = accounts ?? [];

	function toggle(id: string) {
		setExpandedId((cur) => (cur === id ? null : id));
	}

	return (
		<div className="account-list">
			<h2>Accounts</h2>
			<StatusMessage
				loading={loading}
				error={error}
				empty={!loading && list.length === 0}
			>
				<ul>
					{list.map((a: AccountOut) => (
						<li key={a.accountId} className="account-list__item">
							<button
								className="account-list__row"
								aria-expanded={expandedId === a.accountId}
								onClick={() => toggle(a.accountId)}
								type="button"
							>
								<span>{a.accountType}</span>
								<span className="muted">{a.accountId.slice(-6)}</span>
								<Money value={a.balance} />
							</button>

							{expandedId === a.accountId && (
								<AccountPanel
									account={a}
									siblingAccounts={list}
									onChanged={reload}
								/>
							)}
						</li>
					))}
				</ul>
			</StatusMessage>
		</div>
	);
}
