import { useState } from "react";
import { accountsApi } from "../api";
import type { AccountType, UserOut } from "../api";
import { useAsyncFn } from "../hooks/useAsync";
import { Field } from "./Field";
import { StatusMessage } from "./StatusMessage";

const ACCOUNT_TYPES: AccountType[] = ["SAVINGS", "CHECKING"];

/**
 * Admin-only: open an account FOR a user.
 */
interface AdminOpenAccountFormProps {
	users: UserOut[];
	onCreated?: () => void;
}

export function AdminOpenAccountForm({
	users,
	onCreated,
}: AdminOpenAccountFormProps) {
	const { run, loading, error, data } = useAsyncFn(accountsApi.create);

	const [chosenUserId, setUserId] = useState<string | null>(null);
	const userId = chosenUserId ?? users[0]?.userId ?? "";

	const [accountType, setAccountType] = useState<AccountType>("SAVINGS");
	const [initialDeposit, setInitialDeposit] = useState("");

	async function handleSubmit() {
		if (!userId) return;
		const account = await run({
			userId,
			accountType,
			initialDeposit: initialDeposit || null,
		});
		if (account) {
			setInitialDeposit("");
			onCreated?.();
		}
	}

	return (
		<div className="admin__open-account">
			<h2>Open an account</h2>

			<Field label="For user" htmlFor="acct-user">
				<select
					id="acct-user"
					value={userId}
					onChange={(e) => setUserId(e.target.value)}
				>
					{users.length === 0 && (
						<option value="" disabled>
							— no users —
						</option>
					)}
					{users.map((u) => (
						<option key={u.userId} value={u.userId}>
							{u.name} ({u.email})
						</option>
					))}
				</select>
			</Field>

			<Field label="Account type" htmlFor="acct-type">
				<select
					id="acct-type"
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

			<Field label="Initial deposit (optional)" htmlFor="acct-deposit">
				<input
					id="acct-deposit"
					inputMode="decimal"
					value={initialDeposit}
					onChange={(e) => setInitialDeposit(e.target.value)}
					placeholder="0.00"
				/>
			</Field>

			<button
				type="button"
				onClick={handleSubmit}
				disabled={loading || users.length === 0}
			>
				{loading ? "Opening…" : "Open account"}
			</button>

			{data && <p className="status">Opened account for {data.userName}.</p>}
			<StatusMessage error={error} />
		</div>
	);
}
