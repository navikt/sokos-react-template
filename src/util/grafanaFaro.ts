import { getWebInstrumentations, initializeFaro } from "@grafana/faro-web-sdk";
import { getEnvironment } from "./environment";

type TelemetryCollectorURL =
	| "https://telemetry.nav.no/collect"
	| "https://telemetry.ekstern.dev.nav.no/collect"
	| "http://localhost:12347";

function getTelemetryCollectorURL(): TelemetryCollectorURL {
	if (getEnvironment() === "production") {
		return "https://telemetry.nav.no/collect";
	}

	if (getEnvironment() === "development") {
		return "https://telemetry.ekstern.dev.nav.no/collect";
	}

	return "http://localhost:12347";
}

export function initGrafanaFaro() {
	// Only initialize in production environments (not mock or backend dev mode)
	if (import.meta.env.MODE === "mock" || import.meta.env.MODE === "backend") {
		return;
	}
	initializeFaro({
		isolate: true,
		url: getTelemetryCollectorURL(),
		app: {
			name: "sokos-react-template",
		},
		instrumentations: [
			...getWebInstrumentations({
				captureConsole: false,
			}),
		],
	});
}
