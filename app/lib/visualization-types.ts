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
export const temporalUnits = ["day", "week", "month", "quarter", "year"] as const;
export type TemporalUnit = (typeof temporalUnits)[number];

export function isTemporalUnit(value: unknown): value is TemporalUnit {
	return temporalUnits.includes(value as TemporalUnit);
}

export interface TemporalParserConfig {
	mode: TemporalParserMode;
	sourceUnit: TemporalUnit;
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

export type VisualizationFrequencyMode = "absolute" | "relative";
export type MediaVisualizationChartMode = "bar" | "stack" | "percent";
export type RegionalVisualizationMapMode = "combined" | "separate";
export type RegionalVisualizationBarMode = "bar" | "stack" | "percent";

export interface MediaSourceVisualizationSettings {
	type: "data-display-media-source";
	mode: VisualizationFrequencyMode;
	chartMode: MediaVisualizationChartMode;
	sourceTableExpanded: boolean;
}

export interface MediaTypeVisualizationSettings {
	type: "data-display-media-type";
	mode: VisualizationFrequencyMode;
	chartMode: MediaVisualizationChartMode;
	sourceTableExpanded: boolean;
}

export interface RegionalVisualizationSettings {
	type: "data-display-regional-frequencies";
	mode: VisualizationFrequencyMode;
	mapMode: RegionalVisualizationMapMode;
	barChartMode: RegionalVisualizationBarMode;
	sourceTableExpanded: boolean;
}

export const defaultMediaSourceVisualizationSettings = Object.freeze({
	type: "data-display-media-source",
	mode: "relative",
	chartMode: "stack",
	sourceTableExpanded: false,
} satisfies MediaSourceVisualizationSettings);

export const defaultMediaTypeVisualizationSettings = Object.freeze({
	type: "data-display-media-type",
	mode: "relative",
	chartMode: "stack",
	sourceTableExpanded: false,
} satisfies MediaTypeVisualizationSettings);

export const defaultRegionalVisualizationSettings = Object.freeze({
	type: "data-display-regional-frequencies",
	mode: "relative",
	mapMode: "combined",
	barChartMode: "bar",
	sourceTableExpanded: false,
} satisfies RegionalVisualizationSettings);

function isVisualizationFrequencyMode(value: unknown): value is VisualizationFrequencyMode {
	return value === "absolute" || value === "relative";
}

function isMediaVisualizationChartMode(value: unknown): value is MediaVisualizationChartMode {
	return value === "bar" || value === "stack" || value === "percent";
}

function asUnknownRecord(value: unknown): Record<string, unknown> {
	return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

export function normalizeMediaSourceVisualizationSettings(
	value: unknown,
): MediaSourceVisualizationSettings {
	const record = asUnknownRecord(value);
	return {
		type: "data-display-media-source",
		mode: isVisualizationFrequencyMode(record.mode)
			? record.mode
			: defaultMediaSourceVisualizationSettings.mode,
		chartMode: isMediaVisualizationChartMode(record.chartMode)
			? record.chartMode
			: defaultMediaSourceVisualizationSettings.chartMode,
		sourceTableExpanded: record.sourceTableExpanded === true,
	};
}

export function normalizeMediaTypeVisualizationSettings(
	value: unknown,
): MediaTypeVisualizationSettings {
	const record = asUnknownRecord(value);
	return {
		type: "data-display-media-type",
		mode: isVisualizationFrequencyMode(record.mode)
			? record.mode
			: defaultMediaTypeVisualizationSettings.mode,
		chartMode: isMediaVisualizationChartMode(record.chartMode)
			? record.chartMode
			: defaultMediaTypeVisualizationSettings.chartMode,
		sourceTableExpanded: record.sourceTableExpanded === true,
	};
}

export function normalizeRegionalVisualizationSettings(
	value: unknown,
): RegionalVisualizationSettings {
	const record = asUnknownRecord(value);
	return {
		type: "data-display-regional-frequencies",
		mode: isVisualizationFrequencyMode(record.mode)
			? record.mode
			: defaultRegionalVisualizationSettings.mode,
		mapMode:
			record.mapMode === "combined" || record.mapMode === "separate"
				? record.mapMode
				: defaultRegionalVisualizationSettings.mapMode,
		barChartMode: isMediaVisualizationChartMode(record.barChartMode)
			? record.barChartMode
			: defaultRegionalVisualizationSettings.barChartMode,
		sourceTableExpanded: record.sourceTableExpanded === true,
	};
}

export interface TemporalFrequencyDistributionSettings {
	type: typeof temporalFrequencyDistributionType;
	mode: TemporalFrequencyMode;
	bucketUnit: TemporalUnit;
	dateRange: {
		start: string;
		end: string;
	};
	intervalSize: number;
	reverseIntervals: boolean;
	sourceTableExpanded: boolean;
}

export const defaultTemporalFrequencyDistributionSettings = {
	type: temporalFrequencyDistributionType,
	mode: "relative",
	bucketUnit: "year",
	dateRange: {
		start: "1986-01-01T00:00:00.000Z",
		end: "2025-01-01T00:00:00.000Z",
	},
	intervalSize: 2,
	reverseIntervals: false,
	sourceTableExpanded: false,
} satisfies TemporalFrequencyDistributionSettings;

export const temporalIntervalOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const maximumTemporalBucketCount = 10_000;

function isFiniteInteger(value: unknown): value is number {
	return typeof value === "number" && Number.isSafeInteger(value);
}

function parseIsoDate(value: unknown) {
	if (typeof value !== "string") return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function estimateTemporalBucketCount(start: Date, end: Date, unit: TemporalUnit) {
	const milliseconds = end.getTime() - start.getTime();
	if (unit === "day") return Math.ceil(milliseconds / 86_400_000);
	if (unit === "week") return Math.ceil(milliseconds / 604_800_000);
	const months =
		(end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
	if (unit === "month") return months + 1;
	if (unit === "quarter") return Math.ceil((months + 1) / 3);
	return end.getUTCFullYear() - start.getUTCFullYear() + 1;
}

export function isTemporalBucketRangeSupported(start: Date, end: Date, unit: TemporalUnit) {
	return start < end && estimateTemporalBucketCount(start, end, unit) <= maximumTemporalBucketCount;
}

function normalizeLegacyYearRange(value: unknown) {
	if (typeof value !== "object" || value === null) return null;
	const range = value as Record<string, unknown>;
	if (!isFiniteInteger(range.start) || !isFiniteInteger(range.end) || range.start > range.end) {
		return null;
	}
	const start = new Date(Date.UTC(range.start, 0, 1));
	const end = new Date(Date.UTC(range.end + 1, 0, 1));
	return { start, end };
}

export function normalizeTemporalFrequencyDistributionSettings(
	value: unknown,
): TemporalFrequencyDistributionSettings {
	if (typeof value !== "object" || value === null) {
		return {
			...defaultTemporalFrequencyDistributionSettings,
			dateRange: { ...defaultTemporalFrequencyDistributionSettings.dateRange },
		};
	}

	const record = value as Record<string, unknown>;
	const bucketUnit = isTemporalUnit(record.bucketUnit)
		? record.bucketUnit
		: defaultTemporalFrequencyDistributionSettings.bucketUnit;
	const dateRange = record.dateRange as Record<string, unknown> | undefined;
	const parsedStart = parseIsoDate(dateRange?.start);
	const parsedEnd = parseIsoDate(dateRange?.end);
	const legacyRange = normalizeLegacyYearRange(record.yearRange);
	const start = parsedStart ?? legacyRange?.start ?? null;
	const end = parsedEnd ?? legacyRange?.end ?? null;
	const hasValidRange =
		start !== null && end !== null && isTemporalBucketRangeSupported(start, end, bucketUnit);
	const intervalSize = temporalIntervalOptions.includes(
		record.intervalSize as (typeof temporalIntervalOptions)[number],
	)
		? (record.intervalSize as (typeof temporalIntervalOptions)[number])
		: defaultTemporalFrequencyDistributionSettings.intervalSize;

	return {
		type: temporalFrequencyDistributionType,
		mode: record.mode === "absolute" ? "absolute" : "relative",
		bucketUnit: hasValidRange
			? bucketUnit
			: defaultTemporalFrequencyDistributionSettings.bucketUnit,
		dateRange: {
			start: hasValidRange
				? start.toISOString()
				: defaultTemporalFrequencyDistributionSettings.dateRange.start,
			end: hasValidRange
				? end.toISOString()
				: defaultTemporalFrequencyDistributionSettings.dateRange.end,
		},
		intervalSize,
		reverseIntervals: record.reverseIntervals === true,
		sourceTableExpanded: record.sourceTableExpanded === true,
	};
}

type EmptyVisualizationSettings = Record<string, never>;

export interface VisualizationSettingsByType {
	"data-display-collocations": EmptyVisualizationSettings;
	"data-display-keyword-in-context": EmptyVisualizationSettings;
	"data-display-media-source": MediaSourceVisualizationSettings;
	"data-display-media-type": MediaTypeVisualizationSettings;
	"data-display-regional-frequencies": RegionalVisualizationSettings;
	"data-display-word-form-frequencies": EmptyVisualizationSettings;
	[temporalFrequencyDistributionType]: TemporalFrequencyDistributionSettings;
}

export type VisualizationSettings = VisualizationSettingsByType[VisualizationType];

interface VisualizationSettingsCodec<TSettings> {
	configurable: boolean;
	defaults: Readonly<TSettings>;
	normalize: (value: unknown) => TSettings;
}

const emptyVisualizationSettings = Object.freeze({});

function normalizeEmptyVisualizationSettings(): EmptyVisualizationSettings {
	return {};
}

export const visualizationSettingsCodecs = {
	"data-display-collocations": {
		configurable: false,
		defaults: emptyVisualizationSettings,
		normalize: normalizeEmptyVisualizationSettings,
	},
	"data-display-keyword-in-context": {
		configurable: false,
		defaults: emptyVisualizationSettings,
		normalize: normalizeEmptyVisualizationSettings,
	},
	"data-display-media-source": {
		configurable: true,
		defaults: defaultMediaSourceVisualizationSettings,
		normalize: normalizeMediaSourceVisualizationSettings,
	},
	"data-display-media-type": {
		configurable: true,
		defaults: defaultMediaTypeVisualizationSettings,
		normalize: normalizeMediaTypeVisualizationSettings,
	},
	"data-display-regional-frequencies": {
		configurable: true,
		defaults: defaultRegionalVisualizationSettings,
		normalize: normalizeRegionalVisualizationSettings,
	},
	"data-display-word-form-frequencies": {
		configurable: false,
		defaults: emptyVisualizationSettings,
		normalize: normalizeEmptyVisualizationSettings,
	},
	[temporalFrequencyDistributionType]: {
		configurable: true,
		defaults: defaultTemporalFrequencyDistributionSettings,
		normalize: normalizeTemporalFrequencyDistributionSettings,
	},
} satisfies {
	[TType in VisualizationType]: VisualizationSettingsCodec<VisualizationSettingsByType[TType]>;
};

function getVisualizationSettingsCodec<TType extends VisualizationType>(type: TType) {
	return visualizationSettingsCodecs[type] as VisualizationSettingsCodec<
		VisualizationSettingsByType[TType]
	>;
}

export function getDefaultVisualizationSettings<TType extends VisualizationType>(
	type: TType,
): VisualizationSettingsByType[TType] {
	return getVisualizationSettingsCodec(type).normalize(undefined);
}

export function normalizeVisualizationSettings<TType extends VisualizationType>(
	type: TType,
	value: unknown,
): VisualizationSettingsByType[TType] {
	return getVisualizationSettingsCodec(type).normalize(value);
}

export function hasConfigurableVisualizationSettings(type: VisualizationType) {
	return visualizationSettingsCodecs[type].configurable;
}

export type VisualizationSettingsState = Partial<Record<VisualizationType, unknown>>;

export function createVisualizationSettingsState(
	types: Array<VisualizationType>,
	values: Array<unknown>,
): VisualizationSettingsState {
	return types.reduce<VisualizationSettingsState>((state, type, index) => {
		state[type] = normalizeVisualizationSettings(type, values[index]);
		return state;
	}, {});
}

export function serializeVisualizationSettingsState(
	types: Array<VisualizationType>,
	state: VisualizationSettingsState,
): Array<VisualizationSettings> {
	return types.map((type) => normalizeVisualizationSettings(type, state[type]));
}

export function getVisualizationSettingsForType<TType extends VisualizationType>(
	types: Array<VisualizationType>,
	values: Array<unknown>,
	type: TType,
): VisualizationSettingsByType[TType] {
	const index = types.findIndex((value) => normalizeVisualizationType(value) === type);
	return normalizeVisualizationSettings(type, index >= 0 ? values[index] : undefined);
}
