#!/usr/bin/env node
// Resolves the latest pnpm version that satisfies the repo's minimumReleaseAge
// policy and prints the matching packageManager string with SHA-512 integrity
// hash. The script independently downloads the tarball and verifies the hash
// before printing, so what you paste into package.json is provably bound to
// real bytes — not just whatever the registry manifest claimed.
//
// Usage:
//   node scripts/resolve-pnpm-version.mjs                       # major 11, min age 7d
//   node scripts/resolve-pnpm-version.mjs --major 11 --min-age-days 7

import { argv, version as nodeVersion, env, stdout, stderr } from "node:process";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

const REGISTRY_URL = "https://registry.npmjs.org/pnpm";
const NETWORK_TIMEOUT_MS = 15_000;
const ALLOWED_ALGO = "sha512";
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const SRI_RE = /^sha(?:256|384|512)-[A-Za-z0-9+/]+={0,2}$/;
const TARBALL_HOST = "registry.npmjs.org";

const useColor = stdout.isTTY && stderr.isTTY && !env.NO_COLOR;
const c = {
	reset: useColor ? "\x1b[0m" : "",
	bold: useColor ? "\x1b[1m" : "",
	dim: useColor ? "\x1b[2m" : "",
	red: useColor ? "\x1b[31m" : "",
	green: useColor ? "\x1b[32m" : "",
	yellow: useColor ? "\x1b[33m" : "",
	cyan: useColor ? "\x1b[36m" : "",
};

const major = Number(nodeVersion.slice(1).split(".")[0]);
if (!Number.isFinite(major) || major < 20) {
	error(`This script requires Node.js >= 20 (got ${nodeVersion}).`);
	process.exit(1);
}

const args = parseArgs(argv.slice(2));
const MAJOR = requirePositiveInt(args.major ?? 11, "--major");
const MIN_AGE_DAYS = requirePositiveInt(args["min-age-days"] ?? 7, "--min-age-days");
const CUTOFF = Date.now() - MIN_AGE_DAYS * 86_400_000;

info(`${c.dim}Fetching pnpm metadata from npm registry…${c.reset}`);
const meta = await fetchJson(REGISTRY_URL);
assertManifestShape(meta);

const eligible = Object.entries(meta.time)
	.filter(([v]) => SEMVER_RE.test(v) && Number(v.split(".")[0]) === MAJOR)
	.filter(([, t]) => Number.isFinite(Date.parse(t)) && Date.parse(t) <= CUTOFF)
	.sort(([, a], [, b]) => Date.parse(b) - Date.parse(a));

if (eligible.length === 0) {
	error(`No pnpm@${MAJOR}.x release is at least ${MIN_AGE_DAYS} days old.`);
	process.exit(1);
}

const [version, releasedAt] = eligible[0];
const versionMeta = meta.versions[version];
if (!versionMeta || typeof versionMeta !== "object") {
	error(`Manifest for ${version} is missing or malformed.`);
	process.exit(1);
}

const dist = versionMeta.dist;
if (!dist || typeof dist !== "object") {
	error(`Manifest for ${version} is missing 'dist'.`);
	process.exit(1);
}
const { integrity: sri, tarball } = dist;

if (typeof sri !== "string" || !SRI_RE.test(sri)) {
	error(`Manifest integrity field is not a valid SRI string: ${sri}`);
	process.exit(1);
}

const [algo, b64] = sri.split("-");
if (algo !== ALLOWED_ALGO) {
	error(`Refusing to use non-${ALLOWED_ALGO} integrity (got '${algo}').`);
	process.exit(1);
}

if (typeof tarball !== "string") {
	error("Tarball URL missing from manifest.");
	process.exit(1);
}

const tarballUrl = new URL(tarball);
if (tarballUrl.protocol !== "https:" || tarballUrl.host !== TARBALL_HOST) {
	error(`Refusing tarball from unexpected origin: ${tarballUrl.origin}`);
	process.exit(1);
}

info(`${c.dim}Downloading tarball and verifying SHA-512…${c.reset}`);
const expected = Buffer.from(b64, "base64");
const actual = await downloadAndHash(tarballUrl.toString());
if (!timingSafeEqual(expected, actual)) {
	error("Tarball SHA-512 does NOT match advertised integrity. Aborting.");
	process.exit(1);
}

const hex = expected.toString("hex");
const packageManager = `pnpm@${version}+${algo}.${hex}`;
const ageDays = ((Date.now() - Date.parse(releasedAt)) / 86_400_000).toFixed(1);

stderr.write("\n");
stderr.write(`${c.bold}${c.cyan}Resolved pnpm version${c.reset}\n`);
stderr.write(`  ${c.bold}Version${c.reset}            ${c.green}${version}${c.reset}\n`);
stderr.write(`  ${c.bold}Released${c.reset}           ${releasedAt} ${c.dim}(${ageDays} days ago)${c.reset}\n`);
stderr.write(`  ${c.bold}Tarball check${c.reset}      ${c.green}OK${c.reset} ${c.dim}(independently re-hashed)${c.reset}\n`);
stderr.write(`  ${c.bold}Integrity (SRI)${c.reset}    ${sri}\n`);
stderr.write("\n");

stderr.write(`${c.bold}${c.cyan}Paste this into BOTH package.json files (root + server/):${c.reset}\n\n`);
// stdout = the only thing meant to be piped/copied. NO COLOR codes here.
stdout.write(`"packageManager": "${packageManager}"\n`);
stderr.write("\n");

stderr.write(`${c.bold}${c.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}\n`);
stderr.write(`${c.bold}${c.yellow}!  VERIFY BEFORE PUSHING TO GITHUB${c.reset}\n`);
stderr.write(`${c.bold}${c.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}\n`);
stderr.write(`  1. Confirm version on the official release page:\n`);
stderr.write(`     ${c.cyan}https://github.com/pnpm/pnpm/releases/tag/v${version}${c.reset}\n`);
stderr.write(`  2. Compare the integrity hash above with npm's published value:\n`);
stderr.write(`     ${c.cyan}https://registry.npmjs.org/pnpm/${version}${c.reset}\n`);
stderr.write(`  3. Make sure the version exists on pnpm's GitHub releases (not yanked).\n`);
stderr.write(`  4. Run ${c.bold}pnpm install${c.reset} locally and verify it succeeds before committing.\n`);
stderr.write(`  5. Open a PR — let CI run before merging.\n`);
stderr.write(`${c.bold}${c.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}\n`);

// ---------- helpers ----------

function info(msg) {
	stderr.write(`${msg}\n`);
}

function error(msg) {
	stderr.write(`${c.bold}${c.red}error:${c.reset} ${msg}\n`);
}

function parseArgs(tokens) {
	const out = {};
	for (let i = 0; i < tokens.length; i++) {
		const t = tokens[i];
		if (!t.startsWith("--")) continue;
		const key = t.slice(2);
		const value = tokens[i + 1];
		if (value === undefined || value.startsWith("--")) {
			error(`Missing value for ${t}`);
			process.exit(1);
		}
		out[key] = value;
		i++;
	}
	return out;
}

function requirePositiveInt(raw, label) {
	const n = Number(raw);
	if (!Number.isInteger(n) || n <= 0) {
		error(`${label} must be a positive integer (got '${raw}').`);
		process.exit(1);
	}
	return n;
}

async function fetchJson(url) {
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), NETWORK_TIMEOUT_MS);
	try {
		const res = await fetch(url, {
			signal: ctrl.signal,
			redirect: "error",
			headers: { accept: "application/json" },
		});
		if (!res.ok) throw new Error(`Registry returned HTTP ${res.status}`);
		const ct = res.headers.get("content-type") ?? "";
		if (!ct.includes("application/json")) {
			throw new Error(`Unexpected content-type: ${ct}`);
		}
		return await res.json();
	} finally {
		clearTimeout(timer);
	}
}

async function downloadAndHash(url) {
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), NETWORK_TIMEOUT_MS);
	try {
		const res = await fetch(url, { signal: ctrl.signal, redirect: "error" });
		if (!res.ok) throw new Error(`Tarball returned HTTP ${res.status}`);
		const hash = createHash("sha512");
		for await (const chunk of res.body) hash.update(chunk);
		return hash.digest();
	} finally {
		clearTimeout(timer);
	}
}

function assertManifestShape(m) {
	if (!m || typeof m !== "object") fatal("Manifest is not an object.");
	if (!m.time || typeof m.time !== "object") fatal("Manifest 'time' is not an object.");
	if (!m.versions || typeof m.versions !== "object") fatal("Manifest 'versions' is not an object.");
}

function fatal(msg) {
	error(msg);
	process.exit(1);
}

function timingSafeEqual(a, b) {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
	return diff === 0;
}
