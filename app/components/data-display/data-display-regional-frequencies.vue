<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import {
	BarChart3,
	BarChart4,
	ChartBarStacked,
	Hash,
	Info,
	Map,
	Percent,
	PieChart,
	Rows3,
} from "lucide-vue-next";

import { getQueryWithFacetting } from "@/utils/corpus-query";
import { mapAustria } from "@/utils/map-austria";
import type { components } from "~/lib/noske-types";

type FreqMlResponse = components["schemas"]["11_freqml"];
type FrequencyMode = "absolute" | "relative";
type RegionalMapMode = "combined" | "separate";
type RegionalBarMode = "bar" | "stack" | "percent";

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
const noskeId = computed(() => queries.value[0]?.noske ?? null);
const usesProvidedData = computed(() => props.data !== undefined);
const { client } = useNoskeClient(noskeId, { enabled: computed(() => !usesProvidedData.value) });

const regionalFrequencies = ref<Array<RegionalFrequency>>([]);
const regionalFrequenciesLoading = ref<Array<boolean>>([]);
const chartMode = ref<RegionalMapMode>("combined");
const mode = ref<FrequencyMode>("relative");
const barChartMode = ref<RegionalBarMode>("bar");
const expand = ref(false);

const isCombined = computed(() => chartMode.value === "combined");
const loading = computed(() => regionalFrequenciesLoading.value.some(Boolean));

function setMode(value: unknown) {
	if (value === "absolute" || value === "relative") mode.value = value;
}

function setChartMode(value: unknown) {
	if (value === "combined" || value === "separate") chartMode.value = value;
}

function setBarChartMode(value: unknown) {
	if (value === "bar" || value === "stack" || value === "percent") barChartMode.value = value;
}

function parseRegionalFrequency(query: CorpusQuery, data: FreqMlResponse | null | undefined) {
	return {
		query: query.id,
		data:
			data?.Blocks?.[0]?.Items?.map((item) => ({
				region: item.Word?.[0]?.n ?? "",
				absolute: item.frq ?? 0,
				relative: item.reltt ?? 0,
			})) ?? [],
	};
}

watchEffect(() => {
	if (!usesProvidedData.value) return;
	regionalFrequencies.value = queries.value.map((query, index) =>
		parseRegionalFrequency(query, props.data?.[index]),
	);
	regionalFrequenciesLoading.value = queries.value.map(() => false);
});

const queryDescriptors = computed(() =>
	queries.value.map((query, index) => {
		const queryKey = [
			"get-regional-frequencies",
			noskeId.value,
			query.corpus,
			query.subCorpus,
			JSON.stringify(getQueryWithFacetting(query)),
		] as const;
		return {
			queryKey,
			enabled: Boolean(client.value) && !usesProvidedData.value,
			queryFn: async () => {
				const activeClient = client.value;
				if (!activeClient) throw new Error("NoSketch client is not ready yet.");
				regionalFrequenciesLoading.value[index] = true;
				try {
					const { data, error } = await activeClient.GET("/search/freqml", {
						headers: createNoskeCacheHeaders(queryKey),
						params: {
							query: {
								corpname: query.corpus,
								usesubcorp: query.subCorpus || undefined,
								group: 0,
								showpoc: 1,
								showreltt: 1,
								showrel: 1,
								freqlevel: 1,
								ml1attr: "doc.region",
								ml1ctx: "0~0 > 0",
								json: JSON.stringify({ concordance_query: getQueryWithFacetting(query) }),
							},
						},
					});
					if (error) throw error;
					return data;
				} finally {
					regionalFrequenciesLoading.value[index] = false;
				}
			},
			select: (data: FreqMlResponse) => {
				regionalFrequencies.value[index] = parseRegionalFrequency(query, data);
				return data;
			},
		};
	}),
);

useQueries({ queries: queryDescriptors });

watch(queries, () => {
	if (usesProvidedData.value) return;
	const queryIds = queries.value.map(({ id }) => id);
	regionalFrequencies.value = regionalFrequencies.value.filter(({ query }) =>
		queryIds.includes(query),
	);
	regionalFrequencies.value = regionalFrequencies.value.filter(
		(entry, idx) =>
			regionalFrequencies.value.findIndex((item) => item.query === entry.query) === idx,
	);
});

const regionNames = Object.fromEntries(
	mapAustria.features.map((f) => [String(f.properties["hc-key"]), String(f.properties["name"])]),
);

const regionalBarSeries = computed(() =>
	queries.value.map((query, index) => {
		const data = regionalFrequencies.value[index]?.data ?? [];
		return {
			color: query.color,
			name: `${query.type}: ${query.userInput} (${query.corpus}${
				query.subCorpus ? ` / ${query.subCorpus})` : ")"
			}`,
			data: data.map((item) => {
				const value = item ? (mode.value === "relative" ? item.relative : item.absolute) : 0;
				return [regionNames[item.region] ?? item.region, value] as [string, number];
			}),
		};
	}),
);
</script>

<template>
	<Card>
		<CardHeader v-if="showHeader">
			<CardTitle>{{ t("regionalFrequencies") }}</CardTitle>
			<CardDescription>{{ t("regionalFrequenciesDesc") }}</CardDescription>
		</CardHeader>

		<CardContent class="space-y-4">
			<Toolbar :aria-label="t('VisualizationToolbar.regional')">
				<template v-if="interactive">
					<ToolbarToggleGroup
						class="h-8 rounded-md border border-input bg-background p-0.5 shadow-sm"
						:model-value="chartMode"
						size="sm"
						type="single"
						:aria-label="t('VisualizationToolbar.mapMode')"
						@update:model-value="setChartMode"
					>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger as-child>
									<ToolbarToggleItem
										class="h-7 min-w-7 rounded-sm px-1.5 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-primary/40"
										value="combined"
										:aria-label="t('VisualizationToolbar.combinedMapChart')"
									>
										<Map />
										<PieChart />
									</ToolbarToggleItem>
								</TooltipTrigger>
								<TooltipContent>{{ t("VisualizationToolbar.combinedMapChart") }}</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger as-child>
									<ToolbarToggleItem
										class="h-7 min-w-7 rounded-sm px-1.5 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-primary/40"
										value="separate"
										:aria-label="t('VisualizationToolbar.separateMapCharts')"
									>
										<Map />
										<Map />
									</ToolbarToggleItem>
								</TooltipTrigger>
								<TooltipContent>{{ t("VisualizationToolbar.separateMapCharts") }}</TooltipContent>
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

					<ToolbarToggleGroup
						class="h-8 rounded-md border border-input bg-background p-0.5 shadow-sm"
						:model-value="barChartMode"
						size="sm"
						type="single"
						:aria-label="t('VisualizationToolbar.barChartMode')"
						@update:model-value="setBarChartMode"
					>
						<TooltipProvider>
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
								:loading="regionalFrequenciesLoading[index]"
								:query="query"
								:query-key="queryDescriptors[index]?.queryKey"
							/>
						</div>
					</PopoverContent>
				</Popover>
			</Toolbar>

			<div v-for="(query, index) of queries" :key="query.id">
				<ClientOnly v-if="!regionalFrequenciesLoading[index] && regionalFrequencies[index]">
					<MapChart
						v-if="!isCombined"
						:mode="mode"
						:query="query"
						:resdata="regionalFrequencies[index].data"
					/>
				</ClientOnly>
			</div>

			<div v-if="isCombined && !loading && queries.length > 0">
				<CombinedMapChart :mode="mode" :queries="queries" :resdata="regionalFrequencies" />
			</div>

			<Chart
				v-if="!loading && queries.length > 0"
				:chart-type="barChartMode"
				:percent="true"
				class="h-96"
				:series="regionalBarSeries"
				:title="`${regionalBarSeries.length} ${t('queries')}`"
				:y-axis="t('freq')"
			/>
		</CardContent>

		<Collapsible v-if="showSourceData" v-model:open="expand">
			<CollapsibleContent class="px-6 pb-6">
				<DataDisplaySourceTable
					:data="regionalFrequencies.map((entry) => entry.data)"
					datatype="regionalFrequencies"
					:loading="regionalFrequenciesLoading"
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
