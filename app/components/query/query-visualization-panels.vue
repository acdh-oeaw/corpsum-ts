<script setup lang="ts">
import DataDisplayCollocations from "@/components/data-display/data-display-collocations.vue";
import DataDisplayKeywordInContext from "@/components/data-display/data-display-keyword-in-context.vue";
import DataDisplayMediaSource from "@/components/data-display/data-display-media-source.vue";
import DataDisplayMediaType from "@/components/data-display/data-display-media-type.vue";
import DataDisplayRegionalFrequencies from "@/components/data-display/data-display-regional-frequencies.vue";
import DataDisplayTemporalFrequencyDistribution from "@/components/data-display/data-display-temporal-frequency-distribution.vue";
import DataDisplayWordFormFrequencies from "@/components/data-display/data-display-word-form-frequencies.vue";
import {
	type VisualizationSettingsByType,
	type VisualizationSettingsState,
	type VisualizationType,
	normalizeVisualizationSettings,
	temporalFrequencyDistributionType,
} from "@/lib/visualization-types";

const props = defineProps<{
	queries: Array<CorpusQuery>;
	selectedTypes: Array<VisualizationType>;
	settings: VisualizationSettingsState;
	kwicReady: boolean;
}>();

const emit = defineEmits<{
	"update:settings": [
		payload: { type: VisualizationType; settings: VisualizationSettingsByType[VisualizationType] },
	];
}>();

const temporalQueries = computed(() =>
	props.selectedTypes.includes(temporalFrequencyDistributionType) ? props.queries : [],
);
const { mappingsForQueries: temporalMetadataMappings } = await useCorpusMetadataMappings(
	temporalQueries,
	"temporal",
);

function getSettings<TType extends VisualizationType>(type: TType) {
	return normalizeVisualizationSettings(type, props.settings[type]);
}

function updateSettings<TType extends VisualizationType>(
	type: TType,
	settings: VisualizationSettingsByType[TType],
) {
	emit("update:settings", { type, settings });
}
</script>

<template>
	<div class="grid gap-6">
		<DataDisplayTemporalFrequencyDistribution
			v-if="selectedTypes.includes(temporalFrequencyDistributionType)"
			:metadata-mappings="temporalMetadataMappings"
			:queries="queries"
			:settings="getSettings(temporalFrequencyDistributionType)"
			@update:settings="updateSettings(temporalFrequencyDistributionType, $event)"
		/>
		<DataDisplayWordFormFrequencies
			v-if="selectedTypes.includes('data-display-word-form-frequencies')"
			:queries="queries"
			:settings="getSettings('data-display-word-form-frequencies')"
			@update:settings="updateSettings('data-display-word-form-frequencies', $event)"
		/>
		<DataDisplayKeywordInContext
			v-if="selectedTypes.includes('data-display-keyword-in-context') && kwicReady"
			:interactive="false"
			:queries="queries"
		/>
		<DataDisplayMediaSource
			v-if="selectedTypes.includes('data-display-media-source')"
			:queries="queries"
			:settings="getSettings('data-display-media-source')"
			@update:settings="updateSettings('data-display-media-source', $event)"
		/>
		<DataDisplayMediaType
			v-if="selectedTypes.includes('data-display-media-type')"
			:queries="queries"
			:settings="getSettings('data-display-media-type')"
			@update:settings="updateSettings('data-display-media-type', $event)"
		/>
		<DataDisplayRegionalFrequencies
			v-if="selectedTypes.includes('data-display-regional-frequencies')"
			:queries="queries"
			:settings="getSettings('data-display-regional-frequencies')"
			@update:settings="updateSettings('data-display-regional-frequencies', $event)"
		/>
		<DataDisplayCollocations
			v-if="selectedTypes.includes('data-display-collocations')"
			:queries="queries"
			:settings="getSettings('data-display-collocations')"
			@update:settings="updateSettings('data-display-collocations', $event)"
		/>
	</div>
</template>
