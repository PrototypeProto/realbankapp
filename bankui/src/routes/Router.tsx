import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./RootLayout";
import { RequireAdmin, RequireAuth } from "./Guards";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { DashboardPage } from "../pages/DashboardPage";
import { AdminPage } from "../pages/AdminPage";

/**
 * Routes:
 *   /login      public
 *   /register   public   (first registrant becomes admin)
 *   /dashboard  authed   the user's own accounts + actions
 *   /admin      admin    user list, promote, open accounts for users
 *   /           -> /dashboard (guard redirects to /login if not authed)
 */
export const router = createBrowserRouter([
	{
		path: "/",
		Component: RootLayout,
		children: [
			{ index: true, element: <Navigate to="/dashboard" replace /> },
			{ path: "login", Component: LoginPage },
			{ path: "register", Component: RegisterPage },
			{
				path: "dashboard",
				element: (
					<RequireAuth>
						<DashboardPage />
					</RequireAuth>
				),
			},
			{
				path: "admin",
				element: (
					<RequireAdmin>
						<AdminPage />
					</RequireAdmin>
				),
			},
		],
	},
]);
