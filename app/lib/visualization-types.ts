export const temporalFrequencyDistributionType =
	"data-display-metadata-temporal-frequency-distribution" as const;

export type CorpusMetadataSemantic = "temporal";

export const visualizationDefinitions = {
	"data-display-collocations": {
		metadataSemantics: [],
		noskeTargetPath: "/search/collx",
		publishedPanel: true,
		searchKey: "collocations",
	},
	"data-display-keyword-in-context": {
		metadataSemantics: [],
		noskeTargetPath: "/search/concordance",
		publishedPanel: true,
		searchKey: "keywordInContext",
	},
	"data-display-media-source": {
		metadataSemantics: [],
		noskeTargetPath: "/search/freqml",
		publishedPanel: true,
		searchKey: "mediaSources",
	},
	"data-display-media-type": {
		metadataSemantics: [],
		noskeTargetPath: "/search/freqml",
		publishedPanel: true,
		searchKey: "mediaTypes",
	},
	"data-display-regional-frequencies": {
		metadataSemantics: [],
		noskeTargetPath: "/search/freqml",
		publishedPanel: true,
		searchKey: "regionalFrequencies",
	},
	"data-display-word-form-frequencies": {
		metadataSemantics: [],
		noskeTargetPath: "/search/freqml",
		publishedPanel: true,
		searchKey: "wordFormFrequencies",
	},
	[temporalFrequencyDistributionType]: {
		metadataSemantics: ["temporal"],
		noskeTargetPath: "/search/freqml",
		publishedPanel: true,
		searchKey: "yearlyFrequencies",
	},
} as const satisfies Record<
	string,
	{
		metadataSemantics: Array<CorpusMetadataSemantic>;
		noskeTargetPath: "/search/collx" | "/search/concordance" | "/search/freqml" | null;
		publishedPanel: boolean;
		searchKey: string;
	}
>;

export type VisualizationType = keyof typeof visualizationDefinitions;
export type VisualizationSearchKey =
	(typeof visualizationDefinitions)[VisualizationType]["searchKey"];

export const visualizationTypes = Object.keys(visualizationDefinitions) as Array<VisualizationType>;

export function isVisualizationType(value: unknown): value is VisualizationType {
	return typeof value === "string" && visualizationTypes.includes(value as VisualizationType);
}

export function normalizeVisualizationType(value: unknown): VisualizationType {
	return isVisualizationType(value) ? value : "data-display-keyword-in-context";
}

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

export interface CorpusMetadataMappingLookupResponse extends ResolvedCorpusMetadataMappingResponse {
	canEditDefault: boolean;
}

export function getVisualizationMetadataSemantics(
	type: VisualizationType,
): Array<CorpusMetadataSemantic> {
	return [...visualizationDefinitions[type].metadataSemantics];
}

export function getEditableVisualizationMetadataSemantics(
	type: VisualizationType,
): Array<CorpusMetadataSemantic> {
	return getVisualizationMetadataSemantics(type);
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

export function getDefaultVisualizationSettings(type: VisualizationType): unknown {
	if (type === temporalFrequencyDistributionType)
		return defaultTemporalFrequencyDistributionSettings;
	return {};
}

export function normalizeVisualizationSettings(type: VisualizationType, value: unknown): unknown {
	if (type === temporalFrequencyDistributionType) {
		return normalizeTemporalFrequencyDistributionSettings(value);
	}
	return value ?? {};
}
