import path from "node:path";
import cors from "cors";
import express, { type Request, type Response } from "express";
import expressStaticGzip from "express-static-gzip";

const basePath = "/sokos-react-template";
const buildPath = path.resolve(__dirname, "../dist");
const server = express();

const corsAllowedOrigin = [
	/https:\/\/utbetalingsportalen(-[a-z][a-z0-9])?(.ansatt|.intern)(.dev)?.nav.no/,
	"http://localhost:5173",
];

server.use(cors({ origin: corsAllowedOrigin }));

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

// biome-ignore lint/suspicious/noConsole: debug code
server.listen(8080, () => console.log("Server listening on port 8080"));
