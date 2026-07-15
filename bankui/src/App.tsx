import { RouterProvider } from "react-router";
import { CurrentUserProvider } from "./context/CurrentUserContext";
import { router } from "./routes/Router";

export default function App() {
	return (
		<CurrentUserProvider>
			<RouterProvider router={router} />
		</CurrentUserProvider>
	);
}
