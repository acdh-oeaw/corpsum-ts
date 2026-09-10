export function getAmcTemporalDefault(corpus: string) {
	if (!/^amc(?:_|$)/iu.test(corpus)) return null;
	return {
		attribute: "doc.year",
		parser: { mode: "year" as const, sourceUnit: "year" as const },
		valueMap: {},
		label: "Temporal distribution",
	};
}
