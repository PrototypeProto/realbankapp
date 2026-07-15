import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import "./App.css";

function App() {
	const [count, setCount] = useState(0);

	return (
		<>
			<div className="hero">
				<img src={heroImg} className="base" width="170" height="179" alt="" />
				<img src={reactLogo} className="framework" alt="React logo" />
				<img src={viteLogo} className="vite" alt="Vite logo" />
			</div>
			<div>
				<h1>The Banking App</h1>
				<p>Banking with confidence!</p>
			</div>
		</>
	);
}

export default App;
