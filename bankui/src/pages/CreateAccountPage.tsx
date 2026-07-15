import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { accountsApi } from "../api";
import type { AccountType } from "../api";
import { useAsyncFn } from "../hooks/useAsync";
import { Field } from "../components/Field";
import { StatusMessage } from "../components/StatusMessage";

// Kept in sync with the API enum (openapi.json: SAVINGS, CHECKING only).
const ACCOUNT_TYPES: AccountType[] = ["SAVINGS", "CHECKING"];

/**
 * Open an account (spec 7.2 — Account Type dropdown). Requires an existing user.
 * The userId can come in via ?userId= (e.g. right after creating a user) or be
 * entered here. The API 404s if the user doesn't exist.
 */
export function CreateAccountPage() {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const { run, loading, error } = useAsyncFn(accountsApi.create);

	// TODO: proper form state + validation.
	const [userId, setUserId] = useState(params.get("userId") ?? "");
	const [accountType, setAccountType] = useState<AccountType>("SAVINGS");
	const [initialDeposit, setInitialDeposit] = useState("");

	async function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault();
		const account = await run({
			userId,
			accountType,
			// Only send if provided; MoneyIn on the API rejects 0/negative.
			initialDeposit: initialDeposit ? initialDeposit : null,
		});
		if (account) navigate(`/accounts/${account.accountId}`);
	}

	return (
		<section className="page page--create-account">
			<h1>Open an account</h1>

			<form onSubmit={handleSubmit}>
				<Field label="User ID" htmlFor="userId">
					<input
						id="userId"
						value={userId}
						onChange={(e) => setUserId(e.target.value)}
					/>
				</Field>

				<Field label="Account type" htmlFor="accountType">
					<select
						id="accountType"
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

				<Field label="Initial deposit (optional)" htmlFor="initialDeposit">
					<input
						id="initialDeposit"
						inputMode="decimal"
						value={initialDeposit}
						onChange={(e) => setInitialDeposit(e.target.value)}
					/>
				</Field>

				<button type="submit" disabled={loading}>
					{loading ? "Opening…" : "Open account"}
				</button>
			</form>

			<StatusMessage error={error} />
		</section>
	);
}
