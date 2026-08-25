<script setup lang="ts">
import DataDisplayCollocations from "@/components/data-display/data-display-collocations.vue";
import DataDisplayKeywordInContext from "@/components/data-display/data-display-keyword-in-context.vue";
import DataDisplayMediaSource from "@/components/data-display/data-display-media-source.vue";
import DataDisplayMediaType from "@/components/data-display/data-display-media-type.vue";
import DataDisplayRegionalFrequencies from "@/components/data-display/data-display-regional-frequencies.vue";
import DataDisplayTemporalFrequencyDistribution from "@/components/data-display/data-display-temporal-frequency-distribution.vue";
import DataDisplayWordFormFrequencies from "@/components/data-display/data-display-word-form-frequencies.vue";
import {
	type CorpusMetadataMappingResponse,
	type CollocationVisualizationSettings,
	type MediaSourceVisualizationSettings,
	type MediaTypeVisualizationSettings,
	type RegionalVisualizationSettings,
	type TemporalFrequencyDistributionSettings,
	type VisualizationType,
	type WordFormFrequencyVisualizationSettings,
	normalizeVisualizationSettings,
	normalizeVisualizationType,
	temporalFrequencyDistributionType,
} from "@/lib/visualization-types";
import type { components } from "~/lib/noske-types";

interface PublishedQuerySnapshot {
	id: number;
	sourceQueryId: string;
	noske: string;
	type: CorpusQueryType;
	userInput: string;
	finalQuery: string;
	preparedQuery: string;
	color: string;
	corpus: string;
	subCorpus: string;
	concordance_query: Record<string, string> & { queryselector: CorpusQueryType };
	facettingValues: unknown;
	KWICAttrsStructs: KWICAttrsStructs;
	SampleRatio: number;
}

interface PublishedPanelSnapshot {
	type: VisualizationType;
	queryId: string;
	data: unknown;
	settings?: unknown;
	mapping?: CorpusMetadataMappingResponse | null;
}

interface PublishedVisualizationSnapshot {
	queries: Array<PublishedQuerySnapshot>;
	visualizations: Array<VisualizationType>;
	panels: Array<PublishedPanelSnapshot>;
}

type FreqMlResponse = components["schemas"]["11_freqml"];
type CollxResponse = components["schemas"]["10_collx"];

type ConcordanceResponse = components["schemas"]["06_concordance"];

const props = defineProps<{ snapshot: PublishedVisualizationSnapshot; embed?: boolean }>();

const corpusQueries = computed(() => props.snapshot.queries.map(toCorpusQuery));
const renderItems = computed(() =>
	props.snapshot.visualizations.map((type) => normalizeVisualizationType(type)),
);

function findPanel(type: PublishedPanelSnapshot["type"], queryId: string) {
	return props.snapshot.panels.find(
		(panel) => normalizeVisualizationType(panel.type) === type && panel.queryId === queryId,
	);
}

function toCorpusQuery(query: PublishedQuerySnapshot): CorpusQuery {
	return {
		...query,
		concordance_query: query.concordance_query as ConcordanceQuery,
		facettingValues: query.facettingValues as FacettingValues,
		showPicker: false,
		KWICAttrsStructsOptions: { attributes: [], structures: [] },
		KWICAdditionalViewHeaders: [],
		loading: {
			yearlyFrequencies: false,
			wordFormFrequencies: false,
			regionalFrequencies: false,
			keywordInContext: false,
			mediaSources: false,
			collocations: false,
		},
	};
}

const mediaSourceData = computed<Array<FreqMlResponse | null | undefined>>(() =>
	props.snapshot.queries.map(
		(query) =>
			findPanel("data-display-media-source", query.sourceQueryId)?.data as
				| FreqMlResponse
				| undefined,
	),
);
const mediaTypeData = computed<Array<FreqMlResponse | null | undefined>>(() =>
	props.snapshot.queries.map(
		(query) =>
			findPanel("data-display-media-type", query.sourceQueryId)?.data as FreqMlResponse | undefined,
	),
);
const regionalData = computed<Array<FreqMlResponse | null | undefined>>(() =>
	props.snapshot.queries.map(
		(query) =>
			findPanel("data-display-regional-frequencies", query.sourceQueryId)?.data as
				| FreqMlResponse
				| undefined,
	),
);
const wordFormFrequencyData = computed<Array<FreqMlResponse | null | undefined>>(() =>
	props.snapshot.queries.map(
		(query) =>
			findPanel("data-display-word-form-frequencies", query.sourceQueryId)?.data as
				| FreqMlResponse
				| undefined,
	),
);
const collocationData = computed<Array<CollxResponse | null | undefined>>(() =>
	props.snapshot.queries.map(
		(query) =>
			findPanel("data-display-collocations", query.sourceQueryId)?.data as
				| CollxResponse
				| undefined,
	),
);
const concordanceData = computed<Array<ConcordanceResponse | null | undefined>>(() =>
	props.snapshot.queries.map(
		(query) =>
			findPanel("data-display-keyword-in-context", query.sourceQueryId)?.data as
				| ConcordanceResponse
				| undefined,
	),
);
function findPanelSettings(type: VisualizationType) {
	return props.snapshot.panels.find((panel) => normalizeVisualizationType(panel.type) === type)
		?.settings;
}

const mediaSourceSettings = computed<MediaSourceVisualizationSettings>(() =>
	normalizeVisualizationSettings(
		"data-display-media-source",
		findPanelSettings("data-display-media-source"),
	),
);
const mediaTypeSettings = computed<MediaTypeVisualizationSettings>(() =>
	normalizeVisualizationSettings(
		"data-display-media-type",
		findPanelSettings("data-display-media-type"),
	),
);
const regionalSettings = computed<RegionalVisualizationSettings>(() =>
	normalizeVisualizationSettings(
		"data-display-regional-frequencies",
		findPanelSettings("data-display-regional-frequencies"),
	),
);
const wordFormFrequencySettings = computed<WordFormFrequencyVisualizationSettings>(() =>
	normalizeVisualizationSettings(
		"data-display-word-form-frequencies",
		findPanelSettings("data-display-word-form-frequencies"),
	),
);
const collocationSettings = computed<CollocationVisualizationSettings>(() =>
	normalizeVisualizationSettings(
		"data-display-collocations",
		findPanelSettings("data-display-collocations"),
	),
);
const temporalPanels = computed(() =>
	props.snapshot.queries.map((query) =>
		findPanel(temporalFrequencyDistributionType, query.sourceQueryId),
	),
);
const temporalData = computed<Array<FreqMlResponse | null | undefined>>(() =>
	temporalPanels.value.map((panel) => panel?.data as FreqMlResponse | undefined),
);
const temporalMappings = computed(() =>
	temporalPanels.value.map((panel) => panel?.mapping ?? null),
);
const temporalSettings = computed<TemporalFrequencyDistributionSettings>(() =>
	normalizeVisualizationSettings(
		temporalFrequencyDistributionType,
		findPanelSettings(temporalFrequencyDistributionType),
	),
);
</script>

<template>
	<div class="grid gap-6">
		<template v-for="type in renderItems" :key="type">
			<DataDisplayCollocations
				v-if="type === 'data-display-collocations'"
				:data="collocationData"
				:interactive="false"
				:queries="corpusQueries"
				:settings="collocationSettings"
				:show-header="!embed"
				:show-source-data="!embed"
			/>
			<DataDisplayKeywordInContext
				v-else-if="type === 'data-display-keyword-in-context'"
				:data="concordanceData"
				:interactive="false"
				:queries="corpusQueries"
				:show-header="!embed"
			/>
			<DataDisplayTemporalFrequencyDistribution
				v-else-if="type === temporalFrequencyDistributionType"
				:data="temporalData"
				:interactive="!embed"
				:metadata-mappings="temporalMappings"
				:queries="corpusQueries"
				:settings="temporalSettings"
				:show-header="!embed"
				:show-source-data="!embed"
			/>
			<DataDisplayMediaSource
				v-else-if="type === 'data-display-media-source'"
				:data="mediaSourceData"
				:interactive="!embed"
				:queries="corpusQueries"
				:settings="mediaSourceSettings"
				:show-header="!embed"
				:show-source-data="!embed"
			/>
			<DataDisplayMediaType
				v-else-if="type === 'data-display-media-type'"
				:data="mediaTypeData"
				:interactive="!embed"
				:queries="corpusQueries"
				:settings="mediaTypeSettings"
				:show-header="!embed"
				:show-source-data="!embed"
			/>
			<DataDisplayRegionalFrequencies
				v-else-if="type === 'data-display-regional-frequencies'"
				:data="regionalData"
				:interactive="!embed"
				:queries="corpusQueries"
				:settings="regionalSettings"
				:show-header="!embed"
				:show-source-data="!embed"
			/>
			<DataDisplayWordFormFrequencies
				v-else-if="type === 'data-display-word-form-frequencies'"
				:data="wordFormFrequencyData"
				:interactive="!embed"
				:queries="corpusQueries"
				:settings="wordFormFrequencySettings"
				:show-header="!embed"
				:show-source-data="!embed"
			/>
		</template>
	</div>
</template>
