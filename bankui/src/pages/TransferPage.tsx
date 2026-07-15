import { useState } from "react";
import { useNavigate } from "react-router";
import { transfersApi } from "../api";
import { useAsyncFn } from "../hooks/useAsync";
import { Field } from "../components/Field";
import { StatusMessage } from "../components/StatusMessage";

/**
 * Transfer between accounts (bonus). The API requires both accounts to belong
 * to the same user and returns 422 invalid_operation otherwise — that message
 * comes through StatusMessage's invalid_operation branch.
 */
export function TransferPage() {
	const navigate = useNavigate();
	const { run, loading, error } = useAsyncFn(transfersApi.create);

	const [fromAccountId, setFrom] = useState("");
	const [toAccountId, setTo] = useState("");
	const [amount, setAmount] = useState("");

	async function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault();
		const result = await run({ fromAccountId, toAccountId, amount });
		if (result) navigate(`/accounts/${fromAccountId}`);
	}

	return (
		<section className="page page--transfer">
			<h1>Transfer</h1>

			<form onSubmit={handleSubmit}>
				<Field label="From account" htmlFor="from">
					<input
						id="from"
						value={fromAccountId}
						onChange={(e) => setFrom(e.target.value)}
					/>
				</Field>

				<Field label="To account" htmlFor="to">
					<input
						id="to"
						value={toAccountId}
						onChange={(e) => setTo(e.target.value)}
					/>
				</Field>

				<Field label="Amount" htmlFor="amount">
					<input
						id="amount"
						inputMode="decimal"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
					/>
				</Field>

				<button type="submit" disabled={loading}>
					{loading ? "Transferring…" : "Transfer"}
				</button>
			</form>

			<StatusMessage error={error} />
		</section>
	);
}
