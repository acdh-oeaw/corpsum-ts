<script lang="ts" setup>
import { BarChart3, BarChart4, ChartBarStacked, Hash, Info, Percent, Rows3 } from "lucide-vue-next";

import { getQueryWithFacetting } from "@/utils/corpus-query";
import type { components } from "~/lib/noske-types";

type FreqMlResponse = components["schemas"]["11_freqml"];
type FrequencyMode = "absolute" | "relative";
type MediaChartMode = "bar" | "stack" | "percent";

const props = withDefaults(
	defineProps<{
		queries: Array<CorpusQuery>;
		data?: Array<FreqMlResponse | null | undefined>;
		interactive?: boolean;
		showHeader?: boolean;
		showSourceData?: boolean;
	}>(),
	{
		data: undefined,
		interactive: true,
		showHeader: true,
		showSourceData: true,
	},
);

const t = useTranslations();
const queries = computed(() => props.queries);
const usesProvidedData = computed(() => props.data !== undefined);

const mode = ref<FrequencyMode>("relative");
const chartMode = ref<MediaChartMode>("stack");
const expand = ref(false);

function setMode(value: unknown) {
	if (value === "absolute" || value === "relative") mode.value = value;
}

function setChartMode(value: unknown) {
	if (value === "bar" || value === "stack" || value === "percent") chartMode.value = value;
}

function parseMediaDistribution(data: FreqMlResponse | null | undefined) {
	return (
		data?.Blocks?.[0]?.Items?.map((item) => ({
			absolute: item.frq ?? 0,
			relative: item.reltt ?? 0,
			media: item.Word?.[0]?.n ?? "",
		})) ?? []
	);
}

const queryDescriptors = computed<Array<NoskeFreqMlQueryDescriptor>>(() =>
	queries.value.map((query) => {
		const queryKey = [
			"get-source-type-distribution",
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
				fmaxitems: 5000,
				fpage: 1,
				group: 0,
				showpoc: 1,
				showreltt: 1,
				showrel: 1,
				freqlevel: 1,
				ml1attr: "doc.mediatype",
				ml1ctx: "0~0 > 0",
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
const sourceDistributions = computed(() => frequencyData.value.map(parseMediaDistribution));
const sourceDistributionsLoading = computed(() =>
	usesProvidedData.value
		? queries.value.map(() => false)
		: queryResults.value.map((result) => result.isFetching || result.isLoading),
);

const allMediaTypes = computed(() => {
	const allMedia = sourceDistributions.value.flatMap((distribution) =>
		distribution.map((item) => item.media),
	);
	return [...new Set(allMedia)];
});

const mediaTypeSeries = computed(() =>
	queries.value.map((_, index) =>
		(sourceDistributions.value[index] ?? []).map((item) => ({
			label: item.media,
			data: [[item.media, item[mode.value]] as [string, number]],
			color: categoryColors[allMediaTypes.value.indexOf(item.media) % 5],
		})),
	),
);
</script>

<template>
	<Card>
		<CardHeader v-if="showHeader">
			<CardTitle>{{ t("mediaTypes") }}</CardTitle>
			<CardDescription>{{ t("mediaTypesDesc") }}</CardDescription>
		</CardHeader>

		<CardContent class="space-y-4">
			<Toolbar :aria-label="t('VisualizationToolbar.mediaType')">
				<template v-if="interactive">
					<ToolbarToggleGroup
						class="h-8 rounded-md border border-input bg-background p-0.5 shadow-sm"
						:model-value="chartMode"
						size="sm"
						type="single"
						:aria-label="t('VisualizationToolbar.chartMode')"
						@update:model-value="setChartMode"
					>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger as-child>
									<ToolbarToggleItem
										class="h-7 min-w-7 rounded-sm px-1.5 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-primary/40"
										value="bar"
										:aria-label="t('separateBarChart')"
									>
										<BarChart4 />
									</ToolbarToggleItem>
								</TooltipTrigger>
								<TooltipContent>{{ t("separateBarChart") }}</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger as-child>
									<ToolbarToggleItem
										class="h-7 min-w-7 rounded-sm px-1.5 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-primary/40"
										value="stack"
										:aria-label="t('stackedBarChart')"
									>
										<BarChart3 />
									</ToolbarToggleItem>
								</TooltipTrigger>
								<TooltipContent>{{ t("stackedBarChart") }}</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger as-child>
									<ToolbarToggleItem
										class="h-7 min-w-7 rounded-sm px-1.5 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-primary/40"
										value="percent"
										:aria-label="t('percentageBarChart')"
									>
										<ChartBarStacked />
									</ToolbarToggleItem>
								</TooltipTrigger>
								<TooltipContent>{{ t("percentageBarChart") }}</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</ToolbarToggleGroup>

					<ToolbarSeparator />

					<ToolbarToggleGroup
						class="h-8 rounded-md border border-input bg-background p-0.5 shadow-sm"
						:model-value="mode"
						size="sm"
						type="single"
						:aria-label="t('VisualizationToolbar.frequencyMode')"
						@update:model-value="setMode"
					>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger as-child>
									<ToolbarToggleItem
										class="h-7 min-w-7 rounded-sm px-1.5 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-primary/40"
										value="absolute"
										:aria-label="t('absolute')"
									>
										<Hash />
									</ToolbarToggleItem>
								</TooltipTrigger>
								<TooltipContent>{{
									t("VisualizationToolbar.tooltips.absoluteMode")
								}}</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger as-child>
									<ToolbarToggleItem
										class="h-7 min-w-7 rounded-sm px-1.5 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-primary/40"
										value="relative"
										:aria-label="t('relative')"
									>
										<Percent />
									</ToolbarToggleItem>
								</TooltipTrigger>
								<TooltipContent>{{
									t("VisualizationToolbar.tooltips.relativeMode")
								}}</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</ToolbarToggleGroup>

					<ToolbarSeparator />
				</template>

				<Popover>
					<PopoverTrigger
						class="inline-flex h-8 w-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"
						:aria-label="t('VisualizationToolbar.queryDetails')"
						:title="t('VisualizationToolbar.tooltips.queryDetails')"
						type="button"
					>
						<Info />
					</PopoverTrigger>
					<PopoverContent align="end" class="w-80 p-2">
						<div class="max-h-96 space-y-3 overflow-y-auto">
							<QueryDisplay
								v-for="(query, index) of queries"
								:key="query.id"
								class="my-0 rounded-md border p-2"
								:loading="sourceDistributionsLoading[index]"
								:query="query"
								:query-key="queryDescriptors[index]?.queryKey"
							/>
						</div>
					</PopoverContent>
				</Popover>
			</Toolbar>

			<MediaStackedBarChart
				:mode="mode"
				:queries="queries"
				:source-distributions="sourceDistributions"
				:chart-mode="chartMode"
			/>

			<h4 class="mt-16 text-center font-semibold">{{ t("mediaTypeDistribution") }}</h4>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div v-for="(query, index) of queries" :key="query.id">
					<QueryDisplay :query="query" class="justify-center" />
					<Chart chart-type="donut" :series="mediaTypeSeries[index] ?? []" :height="150" />
				</div>
			</div>
		</CardContent>

		<Collapsible v-if="showSourceData" v-model:open="expand">
			<CollapsibleContent class="px-6 pb-6">
				<DataDisplaySourceTable
					:data="sourceDistributions"
					datatype="mediaTypes"
					:loading="sourceDistributionsLoading"
					:queries="queries"
				/>
			</CollapsibleContent>
		</Collapsible>

		<Separator v-if="showSourceData" />

		<CardFooter v-if="showSourceData && interactive">
			<Toolbar :aria-label="t('VisualizationToolbar.sourceData')">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger as-child>
							<ToolbarButton
								:aria-label="!expand ? t('ShowData') : t('HideData')"
								:aria-pressed="expand"
								type="button"
								variant="outline"
								@click="expand = !expand"
							>
								<Rows3 />
							</ToolbarButton>
						</TooltipTrigger>
						<TooltipContent>{{ t("VisualizationToolbar.tooltips.sourceData") }}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</Toolbar>
		</CardFooter>
	</Card>
</template>
