<script lang="ts" setup>
import { Hash, Info, Percent, Rows3 } from "lucide-vue-next";

import ChartRowLimitSelect from "@/components/chart-row-limit-select.vue";
import ChartSortToggle from "@/components/chart-sort-toggle.vue";
import { buttonVariants } from "@/components/ui/button";
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
	"loading-change": [loading: boolean];
}>();

const t = useTranslations();
const sortOrderByQuery = reactive<Record<string, "ascending" | "descending">>({});
const rowLimitByQuery = reactive<Record<string, number>>({});
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

watch(
	queries,
	(value) => {
		const queryIds = new Set(value.map((query) => String(query.id)));
		for (const queryId of Object.keys(sortOrderByQuery)) {
			if (!queryIds.has(queryId)) {
				delete sortOrderByQuery[queryId];
				delete rowLimitByQuery[queryId];
			}
		}
		for (const query of value) {
			const queryId = String(query.id);
			sortOrderByQuery[queryId] ??= "descending";
			rowLimitByQuery[queryId] ??= 30;
		}
	},
	{ immediate: true },
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
		: queryResults.value.map(
				(result) =>
					!result.isError && (result.data === undefined || result.isFetching || result.isLoading),
			),
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

const seriesByQuery = computed(() =>
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
			<QueryDataStatusList
				:errors="wordFormFrequencyErrors"
				:loading="wordFormFrequenciesLoading"
				:queries="queries"
				@loading-change="emit('loading-change', $event)"
			/>

			<div v-for="(query, index) of queries" :key="query.id" class="space-y-4">
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
							<TooltipProvider
								><Tooltip
									><TooltipTrigger as-child
										><ToolbarToggleItem
											value="absolute"
											:aria-label="t('absolute')"
											class="h-7 min-w-7 rounded-sm px-1.5 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-primary/40"
										>
											<Hash /> </ToolbarToggleItem></TooltipTrigger
									><TooltipContent>{{
										t("VisualizationToolbar.tooltips.absoluteMode")
									}}</TooltipContent></Tooltip
								>
								<Tooltip
									><TooltipTrigger as-child
										><ToolbarToggleItem
											value="relative"
											:aria-label="t('relative')"
											class="h-7 min-w-7 rounded-sm px-1.5 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-primary/40"
										>
											<Percent /> </ToolbarToggleItem></TooltipTrigger
									><TooltipContent>{{
										t("VisualizationToolbar.tooltips.relativeMode")
									}}</TooltipContent></Tooltip
								></TooltipProvider
							>
						</ToolbarToggleGroup>
						<ToolbarSeparator />
					</template>
					<ChartSortToggle v-if="interactive" v-model="sortOrderByQuery[String(query.id)]" />

					<ChartRowLimitSelect
						v-if="interactive"
						:model-value="rowLimitByQuery[String(query.id)] ?? 10"
						@update:model-value="rowLimitByQuery[String(query.id)] = $event"
					/>
					<TooltipProvider v-if="showSourceData && interactive"
						><Tooltip
							><TooltipTrigger as-child
								><ToolbarButton
									:aria-label="!expand ? t('ShowData') : t('HideData')"
									:aria-pressed="expand"
									class="w-8 px-0"
									type="button"
									variant="outline"
									@click="setSourceTableExpanded(!expand)"
								>
									<Rows3 /> </ToolbarButton></TooltipTrigger
							><TooltipContent>{{
								!expand ? t("ShowData") : t("HideData")
							}}</TooltipContent></Tooltip
						></TooltipProvider
					>
					<TooltipProvider
						><Tooltip
							><TooltipTrigger as-child>
								<span class="inline-flex"
									><Popover>
										<PopoverTrigger
											:class="buttonVariants({ variant: 'outline', size: 'sm', class: 'w-8 px-0' })"
											:aria-label="t('VisualizationToolbar.queryDetails')"
											type="button"
										>
											<Info />
										</PopoverTrigger>
										<PopoverContent align="end" class="w-80 p-2">
											<QueryDisplay
												:loading="wordFormFrequenciesLoading[index]"
												:query="query"
												:query-key="queryDescriptors[index]?.queryKey"
											/>
										</PopoverContent> </Popover></span></TooltipTrigger
							><TooltipContent>{{
								t("VisualizationToolbar.tooltips.queryDetails")
							}}</TooltipContent></Tooltip
						></TooltipProvider
					>
				</Toolbar>

				<Collapsible v-if="showSourceData" :open="expand" @update:open="setSourceTableExpanded">
					<CollapsibleContent class="pb-0">
						<DataDisplaySourceTable
							:data="[wordFormFrequencies[index] ?? []]"
							datatype="wordFormFrequencies"
							:loading="[wordFormFrequenciesLoading[index] ?? false]"
							:queries="[query]"
						/>
					</CollapsibleContent>
				</Collapsible>

				<div
					v-if="wordFormFrequencyErrors[index]"
					class="rounded-md border border-destructive/50 bg-destructive/5 p-3"
				>
					<QueryDisplay class="my-0" :query="query" />
					<p class="mt-1 text-sm text-destructive" role="alert">
						{{ wordFormFrequencyErrors[index] }}
					</p>
				</div>

				<Chart
					v-if="queries.length > 0"
					:sort-order="sortOrderByQuery[String(query.id)]"
					:row-limit="interactive ? rowLimitByQuery[String(query.id)] : undefined"
					chart-type="bar"
					class="h-96"
					orientation="horizontal"
					:series="seriesByQuery.slice(index, index + 1)"
					:title="query.userInput"
					:y-axis="t('wordFormFrequencies')"
				/>
				<Separator v-if="index < queries.length - 1" />
			</div>
		</CardContent>
	</Card>
</template>
