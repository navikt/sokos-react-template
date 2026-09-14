const isProduction = !!window.location.hostname.match(
	/(intern|ansatt)\.nav\.no/,
);
const isDevelopment = !!window.location.hostname.match(
	/(intern|ansatt)\.dev\.nav\.no/,
);

type Environment = "production" | "development" | "local";

export function getEnvironment(): Environment {
	if (isProduction) {
		return "production";
	}

	if (isDevelopment) {
		return "development";
	}

	return "local";
}
