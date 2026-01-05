import { HttpResponse, http } from "msw";

export const handlers = [
	http.get("/mikrofrontend-api/api/v1/employee", () => {
		return HttpResponse.json(
			[
				{ id: 1, name: "Jonas", profession: "Tech lead" },
				{ id: 2, name: "Ola", profession: "Produkteier" },
				{ id: 3, name: "Kari", profession: "Cleaner" },
			],
			{ status: 200 },
		);
	}),
];
