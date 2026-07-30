import { Provider } from "@navikt/ds-react";
import { nb } from "@navikt/ds-react/locales";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const startMsw = async () => {
	if (import.meta.env.MODE === "mock") {
		try {
			const { worker } = await import("../mock/browser");
			await worker.start({
				onUnhandledRequest: "bypass",
			});
		} catch (error) {
			// biome-ignore lint/suspicious/noConsole: debug code
			console.error("Failed to start MSW", error);
		}
	}
};

startMsw().then(() =>
	ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
		<React.StrictMode>
			<Provider locale={nb}>
				<a className="skip-link" href="#main-content">
					Hopp til innhold
				</a>
				<div className="page-wrapper">
					<div className="page-layout">
						<main id="main-content">
							<App />
						</main>
					</div>
				</div>
			</Provider>
		</React.StrictMode>,
	),
);
