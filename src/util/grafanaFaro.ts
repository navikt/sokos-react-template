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
	// Don't initialize in mock/local environments
	if (
		import.meta.env.MODE === "mock" ||
		import.meta.env.MODE === "backend" ||
		import.meta.env.MODE === "backend-q1"
	) {
		return;
	}

	initializeFaro({
		isolate: true,
		url: getTelemetryCollectorURL(),
		app: {
			name: "sokos-up-attestasjon",
		},
		instrumentations: [
			...getWebInstrumentations({
				captureConsole: false,
			}),
		],
	});
}
