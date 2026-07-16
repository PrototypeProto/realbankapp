import { useState } from "react";
import { accountsApi } from "../api";
import type { AccountOut } from "../api";
import { useAsync } from "../hooks/useAsync";
import { Money } from "./Money";
import { StatusMessage } from "./StatusMessage";
import { TransactionTable } from "./TransactionTable";
import { TransactionForm, type TxnMode } from "./TransactionForm";

const PAGE_SIZE = 10;

/**
 * The expanded detail for one account: balance, the three action tabs
 * (deposit/withdraw/transfer), and paginated history. Rendered inline under the
 * selected row in AccountList.
 *
 * `siblingAccounts` is passed through so the transfer tab can offer the user's
 * other accounts. `onChanged` bubbles up after any successful action so the
 * parent can refetch balances.
 */
interface AccountPanelProps {
	account: AccountOut;
	siblingAccounts: AccountOut[];
	onChanged?: () => void;
}

export function AccountPanel({
	account,
	siblingAccounts,
	onChanged,
}: AccountPanelProps) {
	const [mode, setMode] = useState<TxnMode>("deposit");
	const [page, setPage] = useState(0);

	const {
		data: txns,
		loading,
		error,
		reload,
	} = useAsync(
		(signal) =>
			accountsApi.transactions(
				account.accountId,
				{ limit: PAGE_SIZE, skip: page * PAGE_SIZE },
				signal,
			),
		[account.accountId, page],
	);

	function handleActionDone() {
		reload(); // refresh this account's history
		onChanged?.(); // let the list refresh balances
	}

	const rows = txns ?? [];
	const modes: TxnMode[] = ["deposit", "withdraw", "transfer"];

	// Spinner only when there's nothing to show yet
	const isFirstLoad = loading && rows.length === 0;

	return (
		<div className="account-panel">
			<div className="account-panel__summary">
				<span>Balance</span>
				<strong>
					<Money value={account.balance} />
				</strong>
			</div>

			<div className="account-panel__actions">
				<div className="tabs" role="tablist">
					{modes.map((m) => (
						<button
							key={m}
							role="tab"
							aria-selected={mode === m}
							className={mode === m ? "tab tab--active" : "tab"}
							onClick={() => setMode(m)}
							type="button"
						>
							{m.charAt(0).toUpperCase() + m.slice(1)}
						</button>
					))}
				</div>

				<TransactionForm
					account={account}
					mode={mode}
					siblingAccounts={siblingAccounts}
					onDone={handleActionDone}
				/>
			</div>

			<div className="account-panel__history">
				<h4>Transactions</h4>
				<StatusMessage
					loading={isFirstLoad}
					error={error}
					empty={!loading && rows.length === 0}
				>
					<TransactionTable transactions={rows} />
					<div className="pager">
						<button
							disabled={page === 0}
							onClick={() => setPage((p) => p - 1)}
							type="button"
						>
							Previous
						</button>
						<span>Page {page + 1}</span>
						<button
							disabled={rows.length < PAGE_SIZE}
							onClick={() => setPage((p) => p + 1)}
							type="button"
						>
							Next
						</button>
					</div>
				</StatusMessage>
			</div>
		</div>
	);
}
