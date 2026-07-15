import type { TransactionOut } from "../api";
import { Money } from "./Money";

/**
 * The Transaction History table (spec 7.6): ID, Type, Amount, Date.
 * Pure presentation — hand it the array, it renders. Empty/loading are the
 * caller's job (wrap in <StatusMessage>).
 */
interface TransactionTableProps {
	transactions: TransactionOut[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
	return (
		<table className="txn-table">
			<thead>
				<tr>
					<th>Type</th>
					<th>Amount</th>
					<th>Balance after</th>
					<th>Date</th>
				</tr>
			</thead>
			<tbody>
				{transactions.map((t) => (
					<tr key={t.txnId}>
						<td>{t.type}</td>
						<td>
							{/* deposits/transfer-in are credits; the rest debit the account */}
							{isCredit(t.type) ? "+" : "−"}
							<Money value={t.amount} />
						</td>
						<td>
							<Money value={t.balanceAfter} />
						</td>
						<td>{new Date(t.date).toLocaleString()}</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

function isCredit(type: TransactionOut["type"]): boolean {
	return type === "DEPOSIT" || type === "TRANSFER_IN";
}
