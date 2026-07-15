import { useState } from "react";
import { accountsApi } from "../api";
import type { AccountType } from "../api";
import { useAsyncFn } from "../hooks/useAsync";
import { useCurrentUser } from "../context/CurrentUserContext";
import { Field } from "./Field";
import { StatusMessage } from "./StatusMessage";

const ACCOUNT_TYPES: AccountType[] = ["SAVINGS", "CHECKING"];

/**
 * Open an account for the logged-in user. The userId comes from context, not a
 * form field — that's the point of "logging in". Calls `onCreated` so the
 * parent (dashboard) can refresh its account list.
 */
interface OpenAccountFormProps {
	onCreated?: () => void;
}

export function OpenAccountForm({ onCreated }: OpenAccountFormProps) {
	const { user } = useCurrentUser();
	const { run, loading, error } = useAsyncFn(accountsApi.create);

	const [accountType, setAccountType] = useState<AccountType>("SAVINGS");
	const [initialDeposit, setInitialDeposit] = useState("");

	async function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault();
		if (!user) return;
		const account = await run({
			userId: user.userId,
			accountType,
			initialDeposit: initialDeposit || null,
		});
		if (account) {
			setInitialDeposit("");
			onCreated?.();
		}
	}

	return (
		<form className="open-account" onSubmit={handleSubmit}>
			<h3>Open a new account</h3>

			<Field label="Account type" htmlFor="new-account-type">
				<select
					id="new-account-type"
					value={accountType}
					onChange={(e) => setAccountType(e.target.value as AccountType)}
				>
					{ACCOUNT_TYPES.map((t) => (
						<option key={t} value={t}>
							{t}
						</option>
					))}
				</select>
			</Field>

			<Field label="Initial deposit (optional)" htmlFor="new-account-deposit">
				<input
					id="new-account-deposit"
					inputMode="decimal"
					value={initialDeposit}
					onChange={(e) => setInitialDeposit(e.target.value)}
					placeholder="0.00"
				/>
			</Field>

			<button type="submit" disabled={loading}>
				{loading ? "Opening..." : "Open account"}
			</button>

			<StatusMessage error={error} />
		</form>
	);
}
