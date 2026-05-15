import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type JsonObject = Record<string, unknown>;

interface JsonCheck {
	path: string;
	params: Record<string, string>;
	validate: (payload: JsonObject) => void;
}

interface EndpointCheck {
	path: string;
	params?: Record<string, string>;
}

const specPath = resolve(process.cwd(), "public/noske-bonito.json");
const baseUrl = process.env.NOSKE_BONITO_BASE_URL ?? "https://www.clarin.si/ske/bonito/run.cgi";
const corpname = process.env.NOSKE_BONITO_CORPNAME ?? "parlamint40_at";

function isRecord(value: unknown): value is JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): JsonObject {
	if (!isRecord(value)) {
		throw new Error(`${label} must be an object.`);
	}

	return value;
}

function buildUrl(path: string, params: Record<string, string> = {}) {
	const url = new URL(`${baseUrl.replace(/\/+$/u, "")}/${path.replace(/^\/+/u, "")}`);

	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, value);
	}

	return url;
}

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

async function readJson(url: URL): Promise<JsonObject> {
	const response = await fetch(url);
	const contentType = response.headers.get("content-type") ?? "";
	const text = await response.text();

	assert(
		contentType.includes("application/json"),
		`Expected JSON from ${url.toString()}, got ${contentType || "no content type"}.`,
	);
	assert(response.ok, `Expected 2xx from ${url.toString()}, got ${String(response.status)}.`);

	return requireRecord(JSON.parse(text), url.toString());
}

async function assertCaVariantMissing(check: EndpointCheck) {
	const response = await fetch(buildUrl(check.path, { format: "json", ...(check.params ?? {}) }));
	const text = await response.text();

	assert(
		response.status === 200 || response.status === 400 || response.status === 404,
		`Unexpected status ${String(response.status)} from ${check.path}.`,
	);
	assert(!text.includes('"data"'), `Expected ${check.path} not to return a CA corpora payload.`);
}

function validateSpec() {
	const spec = requireRecord(JSON.parse(readFileSync(specPath, "utf8")), specPath);
	const paths = requireRecord(spec.paths, "Bonito OpenAPI paths");
	const pathNames = Object.keys(paths);

	for (const path of ["/corp_info", "/wordlist", "/concordance", "/freqml"]) {
		assert(pathNames.includes(path), `Bonito spec is missing ${path}.`);
	}
	for (const path of ["/corpora", "/languages", "/tagsets/{templateId}"]) {
		assert(pathNames.includes(path), `Bonito spec is missing ${path}.`);
	}

	assert(
		!pathNames.some((path) => path.startsWith("/search/")),
		"Bonito spec contains /search paths.",
	);
	assert(
		!pathNames.some((path) => path.startsWith("/ca/api/")),
		"Bonito spec contains /ca/api paths.",
	);
}

async function validateLiveEndpoints() {
	const jsonChecks: Array<JsonCheck> = [
		{
			path: "/corp_info",
			params: {
				corpname,
				format: "json",
				struct_attr_stats: "1",
				subcorpora: "1",
			},
			validate(payload) {
				assert(typeof payload.name === "string", "/corp_info response is missing corpus name.");
				assert(Array.isArray(payload.structures), "/corp_info response is missing structures.");
			},
		},
		{
			path: "/wordlist",
			params: {
				corpname,
				format: "json",
				wlattr: "word",
			},
			validate(payload) {
				assert(Array.isArray(payload.Items), "/wordlist response is missing Items.");
			},
		},
		{
			path: "/freqml",
			params: {
				corpname,
				fcrit: "word/e 0",
				format: "json",
				q: 'q[word="der"]',
			},
			validate(payload) {
				assert(Array.isArray(payload.Blocks), "/freqml response is missing Blocks.");
			},
		},
		{
			path: "/corpora",
			params: {
				format: "json",
			},
			validate(payload) {
				assert(Array.isArray(payload.data), "/corpora response is missing data array.");
			},
		},
		{
			path: "/languages",
			params: {
				format: "json",
			},
			validate(payload) {
				assert(Array.isArray(payload.data), "/languages response is missing data array.");
			},
		},
	];

	for (const check of jsonChecks) {
		const payload = await readJson(buildUrl(check.path, check.params));
		check.validate(payload);
		console.log(`OK ${check.path}`);
	}

	for (const check of [
		{ path: "/ca/api/corpora" },
		{ path: "/api/corpora" },
		{ path: "/ca/corpora" },
	]) {
		await assertCaVariantMissing(check);
		console.log(`OK negative ${check.path}`);
	}
}

async function main() {
	validateSpec();
	await validateLiveEndpoints();
	console.log(`Validated Bonito NOSKE spec against ${baseUrl}.`);
}

main().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
