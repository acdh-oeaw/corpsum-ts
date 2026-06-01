export const legacyYearlyFrequenciesType = "data-display-yearly-frequencies" as const;

export const temporalFrequencyDistributionType =
	"data-display-metadata-temporal-frequency-distribution" as const;

export const visualizationTypes = [
	"data-display-collocations",
	"data-display-keyword-in-context",
	"data-display-media-source",
	"data-display-regional-frequencies",
	"data-display-source-table",
	"data-display-word-form-frequencies",
	temporalFrequencyDistributionType,
] as const;

export type VisualizationType = (typeof visualizationTypes)[number];

export function isVisualizationType(value: unknown): value is VisualizationType {
	return typeof value === "string" && visualizationTypes.includes(value as VisualizationType);
}

export function normalizeVisualizationType(value: unknown): VisualizationType {
	if (value === legacyYearlyFrequenciesType) return temporalFrequencyDistributionType;
	return isVisualizationType(value) ? value : "data-display-keyword-in-context";
}

export type CorpusMetadataSemantic = "temporal";
export type CorpusMetadataMappingScope = "default" | "user";
export type TemporalParserMode = "year" | "date" | "regex";

export interface TemporalParserConfig {
	mode: TemporalParserMode;
	pattern?: string;
}

export interface CorpusMetadataMappingPayload {
	noske: string;
	corpus: string;
	semantic: CorpusMetadataSemantic;
	scope: CorpusMetadataMappingScope;
	owner?: string;
	attribute: string;
	parser: TemporalParserConfig;
	valueMap: Record<string, string>;
	label?: string;
	description?: string;
}

export interface CorpusMetadataMappingResponse extends CorpusMetadataMappingPayload {
	_id: string;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface ResolvedCorpusMetadataMappingResponse {
	resolved: CorpusMetadataMappingResponse | null;
	user: CorpusMetadataMappingResponse | null;
	default: CorpusMetadataMappingResponse | null;
}

export type TemporalFrequencyMode = "absolute" | "relative";

export interface TemporalFrequencyDistributionSettings {
	type: typeof temporalFrequencyDistributionType;
	mode: TemporalFrequencyMode;
	yearRange: {
		start: number;
		end: number;
	};
	intervalSize: number;
	reverseIntervals: boolean;
	sourceTableExpanded: boolean;
}

export const defaultTemporalFrequencyDistributionSettings = {
	type: temporalFrequencyDistributionType,
	mode: "relative",
	yearRange: {
		start: 1986,
		end: 2024,
	},
	intervalSize: 2,
	reverseIntervals: false,
	sourceTableExpanded: false,
} satisfies TemporalFrequencyDistributionSettings;

export function normalizeTemporalFrequencyDistributionSettings(
	value: unknown,
): TemporalFrequencyDistributionSettings {
	if (typeof value !== "object" || value === null) {
		return { ...defaultTemporalFrequencyDistributionSettings };
	}

	const record = value as Record<string, unknown>;
	const range = record.yearRange as Record<string, unknown> | undefined;
	const start = typeof range?.start === "number" ? range.start : 1986;
	const end = typeof range?.end === "number" ? range.end : 2024;
	const intervalSize = typeof record.intervalSize === "number" ? record.intervalSize : 2;

	return {
		type: temporalFrequencyDistributionType,
		mode: record.mode === "absolute" ? "absolute" : "relative",
		yearRange: {
			start,
			end,
		},
		intervalSize,
		reverseIntervals: record.reverseIntervals === true,
		sourceTableExpanded: record.sourceTableExpanded === true,
	};
}
