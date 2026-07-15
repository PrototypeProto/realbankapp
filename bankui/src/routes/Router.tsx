import { createBrowserRouter } from "react-router";
import { DashboardPage } from "../pages/DashboardPage";
import { HomePage } from "../pages/HomePage";
import { RegisterPage } from "../pages/RegisterPage";
import { RequireUser } from "./RequireUser";
import { RootLayout } from "./RootLayout";

/**
 * Three routes:
 *   /           Home      — select a user (logs in), or link to register
 *   /register   Register  — create a user, auto-login
 *   /dashboard  Dashboard — the workspace; guarded, needs a selected user
 */
export const router = createBrowserRouter([
	{
		path: "/",
		Component: RootLayout,
		children: [
			{ index: true, Component: HomePage },
			{ path: "register", Component: RegisterPage },
			{
				path: "dashboard",
				element: (
					<RequireUser>
						<DashboardPage />
					</RequireUser>
				),
			},
		],
	},
]);
