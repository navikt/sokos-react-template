import { init } from "@nais/apm";

export function initApm() {
	init({
		namespace: "okonomi",
		app: "sokos-react-template",
		tracing: true,
		devConsoleEcho: false,
	});
}
