import type { components } from "~/lib/noske-types";

type CorpusInfoResponse = components["schemas"]["01_corp_info"];

export const fixedKWICStructures = ["doc.id", "doc.datum", "doc.region", "doc.docsrc"] as const;

export interface KwicQueryOptions {
	attributes: Array<string>;
	structures: Array<string>;
}

export type KwicQueryOptionsById = Record<string, KwicQueryOptions>;

export interface KwicAuthoritativeOptions {
	attributes: Array<string>;
	structures: Array<string>;
}

export function createKwicRequestOptionParams(options: KwicQueryOptions) {
	const structures = options.structures.join(",");
	return {
		attrs: options.attributes.join(","),
		structs: structures,
		refs: options.structures.map((structure) => `=${structure}`).join(","),
	};
}

function isSafeToken(value: unknown): value is string {
	return (
		typeof value === "string" &&
		value.length > 0 &&
		value.trim() === value &&
		!value.includes(",") &&
		!value.includes("=")
	);
}

function hasDuplicates(values: Array<string>) {
	return new Set(values).size !== values.length;
}

function hasCanonicalFixedPrefix(structures: Array<string>) {
	return fixedKWICStructures.every((structure, index) => structures[index] === structure);
}

function isStringArray(value: unknown): value is Array<string> {
	return Array.isArray(value) && value.every(isSafeToken) && !hasDuplicates(value);
}

export function getKwicAuthoritativeOptions(
	corpusInfo: CorpusInfoResponse | null | undefined,
): KwicAuthoritativeOptions {
	return {
		attributes: [
			...new Set(
				(corpusInfo?.attributes ?? [])
					.map((attribute) => attribute.name)
					.filter((name): name is string => isSafeToken(name)),
			),
		],
		structures: [
			...new Set((corpusInfo?.structs ?? []).filter((name): name is string => isSafeToken(name))),
		],
	};
}

export function getKwicAttrsStructsOptions(
	corpusInfo: CorpusInfoResponse | null | undefined,
): KWICAttrsStructsOptions {
	return {
		attributes: (corpusInfo?.attributes ?? []).flatMap((attribute) => {
			if (!isSafeToken(attribute.name)) return [];
			return [
				{
					name: attribute.name,
					id_range: attribute.id_range,
					label: attribute.label ?? attribute.name,
					dynamic: attribute.dynamic ?? "",
					fromattr: attribute.fromattr ?? "",
				},
			];
		}),
		structures: getKwicAuthoritativeOptions(corpusInfo).structures.map((name) => ({ name })),
	};
}

export function parseKwicQueryOptionsOverrides(
	value: unknown,
	allowedQueryIds: ReadonlySet<string>,
): KwicQueryOptionsById | null {
	if (value === undefined) return {};
	if (typeof value !== "object" || value === null || Array.isArray(value)) return null;

	const overrides: KwicQueryOptionsById = {};
	for (const [queryId, options] of Object.entries(value)) {
		if (!allowedQueryIds.has(queryId)) return null;
		if (typeof options !== "object" || options === null || Array.isArray(options)) return null;
		const record = options as Record<string, unknown>;
		if (
			Object.keys(record).some((key) => key !== "attributes" && key !== "structures") ||
			!isStringArray(record.attributes) ||
			!isStringArray(record.structures) ||
			!hasCanonicalFixedPrefix(record.structures)
		) {
			return null;
		}
		overrides[queryId] = {
			attributes: [...record.attributes],
			structures: [...record.structures],
		};
	}
	return overrides;
}

export function validateKwicQueryOptions(
	options: KwicQueryOptions,
	authoritative: KwicAuthoritativeOptions,
) {
	if (
		!isStringArray(options.attributes) ||
		!isStringArray(options.structures) ||
		!hasCanonicalFixedPrefix(options.structures)
	) {
		return false;
	}
	const offeredAttributes = new Set(authoritative.attributes);
	const offeredStructures = new Set(authoritative.structures);
	return (
		fixedKWICStructures.every((structure) => offeredStructures.has(structure)) &&
		options.attributes.every((attribute) => offeredAttributes.has(attribute)) &&
		options.structures.every((structure) => offeredStructures.has(structure))
	);
}

export function resolveValidatedKwicQueryOptions(input: {
	overrides: KwicQueryOptionsById;
	queryIds: Array<string>;
	authoritativeByQueryId: Record<string, KwicAuthoritativeOptions>;
}): KwicQueryOptionsById | null {
	const resolved: KwicQueryOptionsById = {};
	for (const queryId of input.queryIds) {
		const options = input.overrides[queryId] ?? {
			attributes: [],
			structures: [...fixedKWICStructures],
		};
		const authoritative = input.authoritativeByQueryId[queryId];
		if (!authoritative || !validateKwicQueryOptions(options, authoritative)) return null;
		resolved[queryId] = {
			attributes: [...options.attributes],
			structures: [...options.structures],
		};
	}
	return resolved;
}
