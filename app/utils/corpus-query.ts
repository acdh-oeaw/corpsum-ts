export const fixedKWICStructures = ["doc.id", "doc.datum", "doc.region", "doc.docsrc"];

export function buildFinalQuery(type: CorpusQueryType, userInput: string) {
	switch (type) {
		case "wordrow":
			return `[word="${userInput}"]`;
		case "lemmarow":
			return `[lemma="${userInput}"]`;
		case "cqlrow":
			return userInput;
		case "charrow":
		case "iquery":
		case "phraserow":
			return `[word="${userInput}"]`;
	}
}

export function getKWICqueryAttrStrcs(query: CorpusQuery) {
	return {
		attrs: query.KWICAttrsStructs.attributes.join(","),
		structs: query.KWICAttrsStructs.structures.join(","),
	};
}

export function getQueryWithFacetting(query: CorpusQuery) {
	const result: Record<string, string | Array<string>> = { ...query.concordance_query };
	for (const key in query.facettingValues) {
		const elem = query.facettingValues[key];
		if (!elem) continue;
		if (Array.isArray(elem)) {
			if (!elem.length) continue;
			result[`sca_${key}`] = elem;
		} else result[elem.key] = elem.value;
	}
	return result;
}

export function normalizeFacettingValues(value: unknown): FacettingValues {
	if (!isRecord(value) || Array.isArray(value)) return {};

	return Object.entries(value).reduce<FacettingValues>((facets, [key, entry]) => {
		if (Array.isArray(entry)) {
			if (entry.every((item) => typeof item === "string")) {
				facets[key] = entry;
			}
			return facets;
		}

		if (isRecord(entry) && typeof entry.key === "string" && typeof entry.value === "string") {
			facets[key] = {
				key: entry.key,
				value: entry.value,
			};
		}

		return facets;
	}, {});
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
