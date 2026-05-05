import path from "node:path";
import express, { type Request, type Response } from "express";
import expressStaticGzip from "express-static-gzip";

const basePath = "/sokos-react-template";
const buildPath = path.resolve(import.meta.dirname, "../dist");
const server = express();

const corsAllowedOrigins: (string | RegExp)[] = [
	/https:\/\/utbetalingsportalen(-[a-z][a-z0-9])?(.ansatt|.intern)(.dev)?.nav.no/,
	"http://localhost:5173",
];

function isAllowedOrigin(origin: string): boolean {
	return corsAllowedOrigins.some((o) =>
		typeof o === "string" ? o === origin : o.test(origin),
	);
}

server.use((req, res, next) => {
	const origin = req.headers.origin;
	if (origin && isAllowedOrigin(origin)) {
		res.setHeader("Access-Control-Allow-Origin", origin);
		res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
		if (req.method === "OPTIONS") {
			res.sendStatus(204);
			return;
		}
	}
	next();
});

server.use(
	basePath,
	expressStaticGzip(buildPath, {
		enableBrotli: true,
		orderPreference: ["br"],
	}),
);

server.get(`${basePath}/internal/isAlive`, (_req: Request, res: Response) => {
	res.sendStatus(200);
});

server.get(`${basePath}/internal/isReady`, (_req: Request, res: Response) => {
	res.sendStatus(200);
});

// biome-ignore lint/suspicious/noConsole: server startup
server.listen(8080, () => console.log("Server listening on port 8080"));
