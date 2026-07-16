import { useState } from "react";
import { accountsApi } from "../api";
import type { AccountOut } from "../api";
import { useAsyncFn } from "../hooks/useAsync";
import { StatusMessage } from "./StatusMessage";

/**
 * "Close account" action, next to the transaction tabs.
 *
 *  - Empty account (balance 0): close outright, no destination needed — allowed
 *    even if it's the user's only account.
 *  - Non-empty: must sweep the balance into ANOTHER of the user's accounts, so
 *    the button is disabled (with a tooltip) when there's nowhere to sweep.
 */
interface CloseAccountControlProps {
	account: AccountOut;
	siblingAccounts: AccountOut[];
	onClosed?: () => void;
}

export function CloseAccountControl({
	account,
	siblingAccounts,
	onClosed,
}: CloseAccountControlProps) {
	const others = siblingAccounts.filter(
		(a) => a.accountId !== account.accountId,
	);
	const [open, setOpen] = useState(false);
	const [destination, setDestination] = useState(others[0]?.accountId ?? "");
	const { run, loading, error } = useAsyncFn(accountsApi.close);

	const isEmpty = account.balance === 0;
	// Empty accounts can always be closed. Non-empty ones need a destination.
	const canClose = isEmpty || others.length > 0;

	async function confirmClose() {
		// Non-empty accounts require a chosen destination; empty ones don't.
		if (!isEmpty && !destination) return;
		await run(account.accountId, isEmpty ? undefined : destination);
		// close returns void; success is "no error thrown" — run captures any
		// throw into `error`, so check that rather than a return value.
		if (!error) {
			setOpen(false);
			onClosed?.();
		}
	}

	if (!open) {
		return (
			<button
				type="button"
				className="btn-danger"
				disabled={!canClose}
				title={
					canClose
						? "Close this account"
						: "You need another account to move the balance into first"
				}
				onClick={() => setOpen(true)}
			>
				Close account
			</button>
		);
	}

	return (
		<div className="close-account">
			<p className="close-account__prompt">
				{isEmpty
					? "Close this empty account?"
					: "Move the balance to which account, then close this one?"}
			</p>

			{!isEmpty && (
				<select
					value={destination}
					onChange={(e) => setDestination(e.target.value)}
				>
					{others.map((a) => (
						<option key={a.accountId} value={a.accountId}>
							{a.accountType} · {a.accountId.slice(-6)}
						</option>
					))}
				</select>
			)}

			<div className="close-account__actions">
				<button
					type="button"
					className="btn-danger"
					onClick={confirmClose}
					disabled={loading || (!isEmpty && !destination)}
				>
					{loading ? "Closing…" : "Confirm close"}
				</button>
				<button
					type="button"
					className="link-button"
					onClick={() => setOpen(false)}
					disabled={loading}
				>
					Cancel
				</button>
			</div>

			<StatusMessage error={error} />
		</div>
	);
}
