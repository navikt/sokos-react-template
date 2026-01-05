import { resolve } from "node:path";
import terser from "@rollup/plugin-terser";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import EnvironmentPlugin from "vite-plugin-environment";

export default defineConfig(({ mode }) => ({
	base: "/mikrofrontend",
	build: {
		rollupOptions: {
			input: resolve(__dirname, "src/App.tsx"),
			preserveEntrySignatures: "exports-only",
			external: ["react", "react-dom"],
			output: {
				entryFileNames: "bundle.js",
				format: "esm",
			},
		},
	},
	css: {
		modules: {
			generateScopedName: "[name]__[local]___[hash:base64:5]",
		},
	},
	server: {
		proxy: {
			...(mode === "backend" && {
				"/mikrofrontend-api/api/v1": {
					target: "http://localhost:8080",
					rewrite: (path: string) => path.replace(/^\/oppdrag-api/, ""),
					changeOrigin: true,
					secure: false,
				},
			}),
			...(mode === "mock" && {
				"/mockServiceWorker.js": {
					target: "http://localhost:5173",
					rewrite: () => "mikrofrontend/mockServiceWorker.js",
				},
			}),
		},
	},
	plugins: [
		react(),
		cssInjectedByJsPlugin(),
		EnvironmentPlugin({
			NODE_ENV: process.env.NODE_ENV || "development",
		}),
		terser(),
	],
}));
