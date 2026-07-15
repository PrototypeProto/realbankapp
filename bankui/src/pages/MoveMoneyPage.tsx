import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { accountsApi } from "../api";
import { useAsyncFn } from "../hooks/useAsync";
import { Field } from "../components/Field";
import { StatusMessage } from "../components/StatusMessage";

/**
 * Deposit (7.4) and Withdraw (7.5) are the same form with a different endpoint,
 * so they share one component. The route passes `mode`. Withdraw can come back
 * 422 insufficient_funds, which StatusMessage renders.
 */
interface MoveMoneyPageProps {
	mode: "deposit" | "withdraw";
}

export function MoveMoneyPage({ mode }: MoveMoneyPageProps) {
	const { accountId = "" } = useParams();
	const navigate = useNavigate();

	const call = mode === "deposit" ? accountsApi.deposit : accountsApi.withdraw;
	const { run, loading, error } = useAsyncFn(call);

	const [amount, setAmount] = useState("");

	async function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault();
		const txn = await run(accountId, { amount });
		// On success go back to the account so the new balance is visible.
		if (txn) navigate(`/accounts/${accountId}`);
	}

	const title = mode === "deposit" ? "Deposit" : "Withdraw";

	return (
		<section className="page page--move-money">
			<h1>{title}</h1>

			<form onSubmit={handleSubmit}>
				<Field label="Amount" htmlFor="amount">
					<input
						id="amount"
						inputMode="decimal"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
					/>
				</Field>

				<button type="submit" disabled={loading}>
					{loading ? `${title}ing…` : title}
				</button>
			</form>

			<StatusMessage error={error} />
		</section>
	);
}
