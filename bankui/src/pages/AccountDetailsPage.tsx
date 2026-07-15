import { Link, useParams } from "react-router";
import { accountsApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { Money } from "../components/Money";
import { StatusMessage } from "../components/StatusMessage";

/**
 * Account details (spec 7.3): shows Account ID, User Name, Balance, plus
 * buttons to Deposit / Withdraw / View Transactions. Loads on mount via the
 * :accountId route param.
 */
export function AccountDetailsPage() {
	const { accountId = "" } = useParams();

	const {
		data: account,
		loading,
		error,
		reload,
	} = useAsync(() => accountsApi.get(accountId), [accountId]);

	return (
		<section className="page page--account">
			<StatusMessage loading={loading} error={error}>
				{account ? (
					<>
						<h1>{account.userName}</h1>
						<dl className="account__meta">
							<dt>Account</dt>
							<dd>{account.accountId}</dd>
							<dt>Type</dt>
							<dd>{account.accountType}</dd>
							<dt>Balance</dt>
							<dd>
								<Money value={account.balance} />
							</dd>
						</dl>

						<div className="account__actions">
							<Link to={`/accounts/${accountId}/deposit`}>Deposit</Link>
							<Link to={`/accounts/${accountId}/withdraw`}>Withdraw</Link>
							<Link to={`/accounts/${accountId}/transactions`}>
								View transactions
							</Link>
						</div>

						{/* reload() is handy after returning from a deposit/withdraw */}
						<button onClick={reload} type="button">
							Refresh
						</button>
					</>
				) : null}
			</StatusMessage>
		</section>
	);
}
