import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type JsonObject = Record<string, unknown>;

const root = process.cwd();
const sourcePath = resolve(root, "public/noske.json");
const targetPath = resolve(root, "public/noske-bonito.json");

function isRecord(value: unknown): value is JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function requireRecord(value: unknown, label: string): JsonObject {
	if (!isRecord(value)) {
		throw new Error(`${label} must be an object.`);
	}

	return value;
}

function replaceSearchPathReferences(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map((item) => replaceSearchPathReferences(item));
	}

	if (!isRecord(value)) {
		return value;
	}

	const result: JsonObject = {};

	for (const [key, item] of Object.entries(value)) {
		if (typeof item === "string") {
			result[key] = item.replaceAll("/search/", "/").replaceAll("/ca/api/", "/");
			continue;
		}

		result[key] = replaceSearchPathReferences(item);
	}

	return result;
}

function main() {
	const source = requireRecord(JSON.parse(readFileSync(sourcePath, "utf8")), sourcePath);
	const paths = requireRecord(source.paths, "OpenAPI paths");
	const bonito = requireRecord(replaceSearchPathReferences(clone(source)), "Bonito OpenAPI spec");
	const bonitoInfo = requireRecord(bonito.info, "OpenAPI info");

	bonitoInfo.title = `${String(bonitoInfo.title ?? "NoSketch Engine API")} (Bonito run.cgi)`;
	bonitoInfo.description = [
		String(bonitoInfo.description ?? ""),
		"",
		"Derived variant for Bonito-style NoSketch Engine deployments where corpus-search endpoints are served directly below run.cgi, for example /corp_info, and Corpus Architect endpoints are served without the /ca/api prefix, for example /corpora.",
	].join("\n");
	bonito.servers = [
		{
			url: "https://www.clarin.si/ske/bonito/run.cgi",
		},
	];

	const bonitoPaths: JsonObject = {};

	for (const [path, definition] of Object.entries(paths)) {
		if (!path.startsWith("/search/") && !path.startsWith("/ca/api/")) {
			continue;
		}

		const shiftedPath = path.replace(/^\/search/u, "").replace(/^\/ca\/api/u, "");
		bonitoPaths[shiftedPath] = replaceSearchPathReferences(definition);
	}

	bonito.paths = bonitoPaths;

	writeFileSync(targetPath, `${JSON.stringify(bonito, null, "\t")}\n`);
	console.log(`Generated ${targetPath} with ${String(Object.keys(bonitoPaths).length)} paths.`);
}

main();
