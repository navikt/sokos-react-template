import { init } from "@nais/apm";

export function initApm() {
	init({
		namespace: "okonomi",
		app: "sokos-react-template",
		tracing: true,
		devConsoleEcho: false,
		beforeSend: (item) => {
			if (item.meta?.page?.url) {
				try {
					const url = new URL(item.meta.page.url);
					url.search = "";
					item.meta.page.url = url.toString();
				} catch {
					return item;
				}
			}
			return item;
		},
	});
}
