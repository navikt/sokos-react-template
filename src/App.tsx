import { useEffect } from "react";
import { TemplatePage } from "./pages/TemplatePage";
import { initGrafanaFaro } from "./util/grafanaFaro";

export function App() {
	// Initialize Grafana Faro monitoring for production
	useEffect(() => {
		initGrafanaFaro();
	}, []);

	return <TemplatePage />;
}
