export interface KwicQueryOptions {
	attributes: Array<string>;
	structures: Array<string>;
}

export type KwicQueryOptionsById = Record<string, KwicQueryOptions>;

function isStringArray(value: unknown): value is Array<string> {
	return (
		Array.isArray(value) &&
		value.every((entry) => typeof entry === "string" && entry.trim().length > 0)
	);
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
			!isStringArray(record.structures)
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
