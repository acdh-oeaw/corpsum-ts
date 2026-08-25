<script lang="ts" setup>
import { Hash, Info, Percent, Rows3 } from "lucide-vue-next";

import {
	type WordFormFrequencyVisualizationSettings,
	normalizeWordFormFrequencyVisualizationSettings,
} from "@/lib/visualization-types";
import { getQueryWithFacetting } from "@/utils/corpus-query";
import type { components } from "~/lib/noske-types";

type FreqMlResponse = components["schemas"]["11_freqml"];

const props = withDefaults(
	defineProps<{
		queries: Array<CorpusQuery>;
		data?: Array<FreqMlResponse | null | undefined>;
		interactive?: boolean;
		settings?: Partial<WordFormFrequencyVisualizationSettings>;
		showHeader?: boolean;
		showSourceData?: boolean;
	}>(),
	{
		data: undefined,
		interactive: true,
		settings: undefined,
		showHeader: true,
		showSourceData: true,
	},
);

const emit = defineEmits<{
	"update:settings": [settings: WordFormFrequencyVisualizationSettings];
}>();

const t = useTranslations();
const queries = computed(() => props.queries);
const usesProvidedData = computed(() => props.data !== undefined);
const normalizedSettings = computed(() =>
	normalizeWordFormFrequencyVisualizationSettings(props.settings),
);
const mode = ref(normalizedSettings.value.mode);
const expand = ref(normalizedSettings.value.sourceTableExpanded);

watch(
	normalizedSettings,
	(value) => {
		mode.value = value.mode;
		expand.value = value.sourceTableExpanded;
	},
	{ deep: true },
);

function emitSettings() {
	emit(
		"update:settings",
		normalizeWordFormFrequencyVisualizationSettings({
			mode: mode.value,
			sourceTableExpanded: expand.value,
		}),
	);
}

function setMode(value: unknown) {
	if ((value === "absolute" || value === "relative") && value !== mode.value) {
		mode.value = value;
		emitSettings();
	}
}

function setSourceTableExpanded(value: boolean) {
	if (value === expand.value) return;
	expand.value = value;
	emitSettings();
}

function parseWordFormFrequencies(data: FreqMlResponse | null | undefined) {
	return (
		data?.Blocks?.[0]?.Items?.map((item) => ({
			word: item.Word?.[0]?.n ?? "",
			absolute: item.frq ?? 0,
			relative: item.fpm ?? 0,
		})) ?? []
	);
}

const queryDescriptors = computed<Array<NoskeFreqMlQueryDescriptor>>(() =>
	queries.value.map((query) => {
		const queryKey = [
			"get-wordform-frequencies",
			query.noske,
			query.corpus,
			query.subCorpus,
			JSON.stringify(getQueryWithFacetting(query)),
		] as const;
		return {
			queryKey,
			noske: query.noske ?? "",
			enabled: !usesProvidedData.value && Boolean(query.noske),
			params: {
				corpname: query.corpus,
				usesubcorp: query.subCorpus || undefined,
				ml1attr: "word",
				ml1ctx: "0<0~0>0",
				json: JSON.stringify({ concordance_query: getQueryWithFacetting(query) }),
			},
		};
	}),
);

const queryResults = useNoskeFreqMlQueries(queryDescriptors);
const frequencyData = computed(() =>
	usesProvidedData.value
		? queries.value.map((_, index) => props.data?.[index])
		: queryResults.value.map((result) => result.data),
);
const wordFormFrequencies = computed(() => frequencyData.value.map(parseWordFormFrequencies));
const wordFormFrequenciesLoading = computed(() =>
	usesProvidedData.value
		? queries.value.map(() => false)
		: queryResults.value.map((result) => result.isFetching || result.isLoading),
);
const wordFormFrequencyErrors = computed(() =>
	queries.value.map((_, index) => {
		if (usesProvidedData.value) return null;
		const result = queryResults.value[index];
		if (!result?.isError) return null;
		return result.data === undefined
			? t("DataDisplayErrors.wordFormFrequency.loadFailed")
			: t("DataDisplayErrors.wordFormFrequency.refreshFailed");
	}),
);

const series = computed(() =>
	queries.value.map((query, index) => ({
		color: query.color,
		name: `${query.type}: ${query.userInput} (${query.corpus}${
			query.subCorpus ? ` / ${query.subCorpus}` : ""
		})`,
		data:
			wordFormFrequencies.value[index]?.map(
				({ relative, absolute, word }) =>
					[word, mode.value === "relative" ? relative : absolute] as [string, number],
			) ?? [],
	})),
);
</script>

<template>
	<Card :data-frequency-mode="mode">
		<CardHeader v-if="showHeader">
			<CardTitle>{{ t("wordFormFrequencies") }}</CardTitle>
			<CardDescription>{{ t("wordFormFrequenciesDesc") }}</CardDescription>
		</CardHeader>

		<CardContent class="space-y-4">
			<Toolbar :aria-label="t('VisualizationToolbar.wordFormFrequency')">
				<template v-if="interactive">
					<ToolbarToggleGroup
						class="h-8 rounded-md border border-input bg-background p-0.5 shadow-sm"
						:model-value="mode"
						size="sm"
						type="single"
						:aria-label="t('VisualizationToolbar.frequencyMode')"
						@update:model-value="setMode"
					>
						<ToolbarToggleItem value="absolute" :aria-label="t('absolute')">
							<Hash />
						</ToolbarToggleItem>
						<ToolbarToggleItem value="relative" :aria-label="t('relative')">
							<Percent />
						</ToolbarToggleItem>
					</ToolbarToggleGroup>
					<ToolbarSeparator />
				</template>

				<Popover>
					<PopoverTrigger
						class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background"
						:aria-label="t('VisualizationToolbar.queryDetails')"
						type="button"
					>
						<Info />
					</PopoverTrigger>
					<PopoverContent align="end" class="w-80 p-2">
						<QueryDisplay
							v-for="(query, index) of queries"
							:key="query.id"
							:loading="wordFormFrequenciesLoading[index]"
							:query="query"
							:query-key="queryDescriptors[index]?.queryKey"
						/>
					</PopoverContent>
				</Popover>
			</Toolbar>

			<div v-if="wordFormFrequencyErrors.some(Boolean)" class="space-y-2">
				<div
					v-for="(query, index) of queries"
					v-show="wordFormFrequencyErrors[index]"
					:key="query.id"
					class="rounded-md border border-destructive/50 bg-destructive/5 p-3"
				>
					<QueryDisplay class="my-0" :query="query" />
					<p class="mt-1 text-sm text-destructive" role="alert">
						{{ wordFormFrequencyErrors[index] }}
					</p>
				</div>
			</div>

			<Chart
				v-if="queries.length > 0"
				chart-type="bar"
				class="h-96"
				orientation="horizontal"
				:series="series"
				:title="t('wordFormFrequencies')"
				:y-axis="t('sources')"
			/>
		</CardContent>

		<Collapsible v-if="showSourceData" :open="expand" @update:open="setSourceTableExpanded">
			<CollapsibleContent class="px-6 pb-6">
				<DataDisplaySourceTable
					:data="wordFormFrequencies"
					datatype="wordFormFrequencies"
					:loading="wordFormFrequenciesLoading"
					:queries="queries"
				/>
			</CollapsibleContent>
		</Collapsible>

		<Separator v-if="showSourceData" />
		<CardFooter v-if="showSourceData && interactive">
			<Toolbar :aria-label="t('VisualizationToolbar.sourceData')">
				<ToolbarButton
					:aria-label="!expand ? t('ShowData') : t('HideData')"
					:aria-pressed="expand"
					type="button"
					variant="outline"
					@click="setSourceTableExpanded(!expand)"
				>
					<Rows3 />
				</ToolbarButton>
			</Toolbar>
		</CardFooter>
	</Card>
</template>
