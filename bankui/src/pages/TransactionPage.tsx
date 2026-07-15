import { useState } from "react";
import { useParams } from "react-router";
import { accountsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { StatusMessage } from "../components/StatusMessage";
import { TransactionTable } from "../components/TransactionTable";

const PAGE_SIZE = 20;

/**
 * Transaction history (spec 7.6). The API supports ?limit=&skip=, so this is
 * where the bonus pagination lives. Skeleton wires the paging state; refine the
 * controls as you like.
 */
export function TransactionsPage() {
	const { accountId = "" } = useParams();
	const [page, setPage] = useState(0);

	const { data, loading, error } = useAsync(
		() =>
			accountsApi.transactions(accountId, {
				limit: PAGE_SIZE,
				skip: page * PAGE_SIZE,
			}),
		[accountId, page],
	);

	const txns = data ?? [];

	return (
		<section className="page page--transactions">
			<h1>Transactions</h1>

			<StatusMessage
				loading={loading}
				error={error}
				empty={!loading && txns.length === 0}
			>
				<TransactionTable transactions={txns} />

				<div className="pager">
					<button
						disabled={page === 0}
						onClick={() => setPage((p) => p - 1)}
						type="button"
					>
						Previous
					</button>
					<span>Page {page + 1}</span>
					{/* No total count from the API; enable "next" while the page is full. */}
					<button
						disabled={txns.length < PAGE_SIZE}
						onClick={() => setPage((p) => p + 1)}
						type="button"
					>
						Next
					</button>
				</div>
			</StatusMessage>
		</section>
	);
}
