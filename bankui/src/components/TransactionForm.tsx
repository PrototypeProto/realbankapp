import { useState } from "react";
import { accountsApi, transfersApi } from "../api";
import type { AccountOut } from "../api";
import { useAsyncFn } from "../hooks/useAsync";
import { Field } from "./Field";
import { StatusMessage } from "./StatusMessage";

export type TxnMode = "deposit" | "withdraw" | "transfer";

/**
 * Deposit, withdraw, and transfer share this one form; `mode` switches the
 * endpoint and the extra "destination" field for transfers.
 *
 * For transfers, the destination is chosen from the user's OTHER accounts — the
 * API enforces that both accounts share an owner, so offering only same-user
 * accounts keeps the UI from ever triggering that 422.
 *
 * NB: this is a plain <div>, not a <form>. There's no native form submit, so
 * nothing can trigger a full-page reload — the action runs on the button's
 * onClick. (A <form>+submit reloads the page unless preventDefault fires on
 * exactly the right event; sidestepping the form removes that class of bug.)
 */
interface TransactionFormProps {
	account: AccountOut;
	mode: TxnMode;
	siblingAccounts: AccountOut[];
	onDone?: () => void; // fired after success, so the parent can refresh balances
}

export function TransactionForm({
	account,
	mode,
	siblingAccounts,
	onDone,
}: TransactionFormProps) {
	const deposit = useAsyncFn(accountsApi.deposit);
	const withdraw = useAsyncFn(accountsApi.withdraw);
	const transfer = useAsyncFn(transfersApi.create);
	const active =
		mode === "deposit" ? deposit : mode === "withdraw" ? withdraw : transfer;

	const others = siblingAccounts.filter(
		(a) => a.accountId !== account.accountId,
	);
	const [amount, setAmount] = useState("");
	const [toAccountId, setToAccountId] = useState(others[0]?.accountId ?? "");

	// No event parameter — runs from onClick, not a form submit, so there's no
	// default navigation to prevent and no FormEvent/SubmitEvent to type.
	async function handleSubmit() {
		let ok: unknown;
		if (mode === "deposit") {
			ok = await deposit.run(account.accountId, { amount });
		} else if (mode === "withdraw") {
			ok = await withdraw.run(account.accountId, { amount });
		} else {
			if (!toAccountId) return;
			ok = await transfer.run({
				fromAccountId: account.accountId,
				toAccountId,
				amount,
			});
		}
		if (ok) {
			setAmount("");
			onDone?.();
		}
	}

	const label = mode.charAt(0).toUpperCase() + mode.slice(1);
	const transferBlocked = mode === "transfer" && others.length === 0;

	return (
		<div className="txn-form">
			{mode === "transfer" && (
				<Field label="To account" htmlFor="txn-to">
					<select
						id="txn-to"
						value={toAccountId}
						onChange={(e) => setToAccountId(e.target.value)}
					>
						{others.length === 0 && (
							<option value="" disabled>
								— no other accounts —
							</option>
						)}
						{others.map((a) => (
							<option key={a.accountId} value={a.accountId}>
								{a.accountType} · {a.accountId.slice(-6)}
							</option>
						))}
					</select>
				</Field>
			)}

			<Field label="Amount" htmlFor="txn-amount">
				<input
					id="txn-amount"
					inputMode="decimal"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					placeholder="0.00"
					onKeyDown={(e) => {
						// Enter-to-submit, since there's no form to do it for us.
						if (e.key === "Enter" && !active.loading && !transferBlocked) {
							handleSubmit();
						}
					}}
				/>
			</Field>

			<button
				type="button"
				onClick={handleSubmit}
				disabled={active.loading || transferBlocked}
			>
				{active.loading ? `${label}ing…` : label}
			</button>

			<StatusMessage error={active.error} />
		</div>
	);
}
