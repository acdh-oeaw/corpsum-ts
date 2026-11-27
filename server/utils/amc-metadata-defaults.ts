import { isAmcCorpus } from "../../shared/amc-corpus.ts";

export function getAmcTemporalDefault(corpus: string) {
	if (!isAmcCorpus(corpus)) return null;
	return {
		attribute: "doc.year",
		parser: { mode: "year" as const, sourceUnit: "year" as const },
		valueMap: {},
		label: "Temporal distribution",
	};
}
