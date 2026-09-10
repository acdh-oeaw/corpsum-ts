import {
	type VisualizationSettingsState,
	type VisualizationType,
	createVisualizationSettingsState,
	normalizeTemporalFrequencyDistributionSettings,
	temporalFrequencyDistributionType,
} from "@/lib/visualization-types";

const genericVisualizationTypes = [
	"data-display-word-form-frequencies",
	"data-display-keyword-in-context",
] as const satisfies ReadonlyArray<VisualizationType>;

const amcVisualizationTypes = [
	temporalFrequencyDistributionType,
	"data-display-word-form-frequencies",
	"data-display-keyword-in-context",
	"data-display-media-source",
	"data-display-media-type",
	"data-display-regional-frequencies",
	"data-display-collocations",
] as const satisfies ReadonlyArray<VisualizationType>;

export interface DefaultVisualizationPreset {
	types: Array<VisualizationType>;
	settings: VisualizationSettingsState;
}

export function isAmcCorpus(corpus: string) {
	return /^amc(?:_|$)/iu.test(corpus);
}

export function getDefaultVisualizationPreset(corpus: string): DefaultVisualizationPreset {
	const types = [...(isAmcCorpus(corpus) ? amcVisualizationTypes : genericVisualizationTypes)];
	const settings = createVisualizationSettingsState(types, []);
	if (isAmcCorpus(corpus)) {
		settings[temporalFrequencyDistributionType] = normalizeTemporalFrequencyDistributionSettings({
			rangeMode: "auto",
		});
	}
	return { types, settings };
}
