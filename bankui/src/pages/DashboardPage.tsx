import { useState } from "react";
import { useCurrentUser } from "../context/CurrentUserContext";
import { UserSwitcher } from "../components/UserSwitcher";
import { AccountList } from "../components/AccountList";
import { OpenAccountForm } from "../components/OpenAccountForm";

/**
 * The signed-in user's workspace: switch user, open accounts, and (via the
 * inline-expanding AccountList) view details, deposit, withdraw, transfer, and
 * see history. All the former "pages" live here as components.
 *
 * `refresh` is a counter bumped when an account is opened, to re-fetch the list.
 */
export function DashboardPage() {
	const { user } = useCurrentUser();
	const [refresh, setRefresh] = useState(0);

	// Route guard should prevent this, but keep a friendly fallback.
	if (!user) return <p className="status">No user selected.</p>;

	return (
		<section className="page page--dashboard">
			<UserSwitcher />

			<div className="dashboard__grid">
				<AccountList refreshSignal={refresh} />
				<OpenAccountForm onCreated={() => setRefresh((n) => n + 1)} />
			</div>
		</section>
	);
}
