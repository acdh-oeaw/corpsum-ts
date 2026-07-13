<script lang="ts" setup>
import { CalendarDays, CalendarRange, Hash, Percent, Rows3 } from "lucide-vue-next";

import {
	type CorpusMetadataMappingResponse,
	type TemporalFrequencyDistributionSettings,
	type TemporalUnit,
	defaultTemporalFrequencyDistributionSettings,
	isTemporalBucketRangeSupported,
	normalizeTemporalFrequencyDistributionSettings,
	temporalIntervalOptions,
} from "@/lib/visualization-types";
import { getQueryWithFacetting } from "@/utils/corpus-query";
import type { components } from "~/lib/noske-types";

import {
	type TemporalFrequency,
	type TemporalFrequencyParser,
	type TemporalFrequencyPoint,
	aggregateTemporalFrequencies,
	createTemporalFrequencyParser,
	formatTemporalFrequencyInterval,
	formatTemporalTimestamp,
	getAllowedTemporalBucketUnitsForMappings,
	getTemporalSourceUnit,
	groupTemporalFrequencyPoints,
} from "./data-display-temporal-frequency-distribution.transformations.ts";

type FreqMlResponse = components["schemas"]["11_freqml"];
type FreqMlBlock = NonNullable<FreqMlResponse["Blocks"]>[number];
type FreqMlItem = NonNullable<FreqMlBlock["Items"]>[number];

type FrequencyMode = "absolute" | "relative";

interface TemporalFrequencySeries {
	name: string;
	data: Array<TemporalFrequencyPoint>;
	color: string;
}

const props = withDefaults(
	defineProps<{
		queries: Array<CorpusQuery>;
		settings?: Partial<TemporalFrequencyDistributionSettings>;
		metadataMappings?: Array<CorpusMetadataMappingResponse | null>;
		data?: Array<FreqMlResponse | null | undefined>;
		interactive?: boolean;
		showHeader?: boolean;
		showSourceData?: boolean;
	}>(),
	{
		data: undefined,
		interactive: true,
		metadataMappings: undefined,
		settings: undefined,
		showHeader: true,
		showSourceData: true,
	},
);

const emit = defineEmits<{
	"update:settings": [settings: TemporalFrequencyDistributionSettings];
}>();

const t = useTranslations();
const locale = useLocale();

const activeQueries = computed(() => props.queries);
const normalizedSettings = computed(() =>
	normalizeTemporalFrequencyDistributionSettings(props.settings),
);

const intervalOptions = temporalIntervalOptions;
const mode = ref<FrequencyMode>(normalizedSettings.value.mode);
const bucketUnit = ref<TemporalUnit>(normalizedSettings.value.bucketUnit);
const interval = ref(normalizedSettings.value.intervalSize);
const reverse = ref(normalizedSettings.value.reverseIntervals);
const expand = ref(normalizedSettings.value.sourceTableExpanded);
const rangeStart = ref(normalizedSettings.value.dateRange.start.slice(0, 10));
const rangeEnd = ref(normalizedSettings.value.dateRange.end.slice(0, 10));

function createIsoDate(value: string) {
	const date = new Date(`${value}T00:00:00.000Z`);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const selectedDateRange = computed(() => {
	const start = createIsoDate(rangeStart.value);
	const end = createIsoDate(rangeEnd.value);
	return start && end && start < end ? { start, end } : null;
});

watch(
	normalizedSettings,
	(value) => {
		mode.value = value.mode;
		bucketUnit.value = value.bucketUnit;
		interval.value = value.intervalSize;
		reverse.value = value.reverseIntervals;
		expand.value = value.sourceTableExpanded;
		rangeStart.value = value.dateRange.start.slice(0, 10);
		rangeEnd.value = value.dateRange.end.slice(0, 10);
	},
	{ deep: true },
);

watch([mode, bucketUnit, interval, reverse, expand, rangeStart, rangeEnd], () => {
	if (!selectedDateRange.value) return;
	emit("update:settings", {
		type: defaultTemporalFrequencyDistributionSettings.type,
		mode: mode.value,
		bucketUnit: bucketUnit.value,
		dateRange: selectedDateRange.value,
		intervalSize: interval.value,
		reverseIntervals: reverse.value,
		sourceTableExpanded: expand.value,
	});
});

const mappings = computed(() => props.metadataMappings ?? []);
const supportedBucketUnits = computed(() =>
	getAllowedTemporalBucketUnitsForMappings(mappings.value),
);
const availableBucketUnits = computed(() => {
	if (!selectedDateRange.value) return supportedBucketUnits.value;
	const { start, end } = selectedDateRange.value;
	return supportedBucketUnits.value.filter((unit) =>
		isTemporalBucketRangeSupported(new Date(start), new Date(end), unit),
	);
});
const bucketUnitOptions = computed(() =>
	availableBucketUnits.value.map((unit) => ({
		value: unit,
		label: formatTemporalUnit(unit, 1),
	})),
);
const intervalSizeOptions = computed(() =>
	intervalOptions.map((value) => ({
		value,
		label: `${value} ${formatTemporalUnit(bucketUnit.value, value)}`,
	})),
);
const intervalDirection = computed({
	get: () => (reverse.value ? "reverse" : "forward"),
	set: (value?: string) => {
		reverse.value = value === "reverse";
	},
});
const usesProvidedData = computed(() => props.data !== undefined);
watchEffect(() => {
	if (!availableBucketUnits.value.includes(bucketUnit.value)) {
		bucketUnit.value = availableBucketUnits.value.at(-1) ?? "year";
	}
});
const dateRange = computed(() => ({
	start: new Date(selectedDateRange.value?.start ?? normalizedSettings.value.dateRange.start),
	end: new Date(selectedDateRange.value?.end ?? normalizedSettings.value.dateRange.end),
}));
const missingMappingQueries = computed(() =>
	activeQueries.value.filter((_, index) => !mappings.value[index]),
);
const temporalParsers = computed(() =>
	mappings.value.map((mapping) => (mapping ? createTemporalFrequencyParser(mapping) : null)),
);
const invalidMappingQueries = computed(() =>
	activeQueries.value.filter((_, index) => temporalParsers.value[index]?.error),
);
const queryableQueryCount = computed(
	() =>
		activeQueries.value.filter((_, index) => {
			const parser = temporalParsers.value[index];
			return parser && !parser.error;
		}).length,
);

const queryDescriptors = computed<Array<NoskeFreqMlQueryDescriptor>>(() =>
	activeQueries.value.map((query, index) => {
		const mapping = mappings.value[index];
		const queryKey = [
			"get-temporal-frequency-distribution",
			query.noske,
			query.corpus,
			query.subCorpus,
			mapping?.attribute,
			JSON.stringify(getQueryWithFacetting(query)),
		] as const;
		return {
			queryKey,
			noske: query.noske ?? "",
			enabled: !usesProvidedData.value && Boolean(mapping) && !temporalParsers.value[index]?.error,
			params: {
				corpname: query.corpus,
				usesubcorp: query.subCorpus || undefined,
				group: 0,
				showpoc: 1,
				showreltt: 1,
				showrel: 1,
				freqlevel: 1,
				ml1attr: mapping?.attribute ?? "",
				ml1ctx: "0~0 > 0",
				json: JSON.stringify({
					concordance_query: getQueryWithFacetting(query),
				}),
			},
		};
	}),
);

const queryResults = useNoskeFreqMlQueries(queryDescriptors);
const frequencyData = computed(() =>
	usesProvidedData.value
		? activeQueries.value.map((_, index) => props.data?.[index])
		: queryResults.value.map((result) => result.data),
);

const temporalFrequencies = computed(() =>
	frequencyData.value.map((data, index) => {
		const parser = temporalParsers.value[index];
		const mapping = mappings.value[index];
		if (!parser || parser.error || !data) return [];
		return aggregateTemporalFrequencies(
			parseTemporalFrequencies(data, parser),
			dateRange.value,
			bucketUnit.value,
			mapping ? getTemporalSourceUnit(mapping) : undefined,
		);
	}),
);

const temporalFrequenciesLoading = computed(() =>
	usesProvidedData.value
		? activeQueries.value.map(() => false)
		: queryResults.value.map((result) => result.isFetching || result.isLoading),
);
const temporalFrequenciesErrors = computed(() =>
	activeQueries.value.map((_, index) => {
		const parserError = temporalParsers.value[index]?.error;
		if (parserError) return parserError;
		if (usesProvidedData.value) return null;
		const result = queryResults.value[index];
		return result?.isError ? t("TemporalFrequencyDistribution.errors.loadFailed") : null;
	}),
);

const normalizationWarnings = computed(() =>
	frequencyData.value.map((data, index) => {
		const parser = temporalParsers.value[index];
		if (!parser || parser.error || !data) return 0;
		return countUnparseableTemporalValues(data, parser);
	}),
);

function parseTemporalFrequencies(
	data: FreqMlResponse,
	parser: TemporalFrequencyParser,
): Array<TemporalFrequency> {
	return data.Blocks?.[0]?.Items?.flatMap((item) => parseTemporalFrequencyItem(item, parser)) ?? [];
}

function parseTemporalFrequencyItem(
	item: FreqMlItem,
	parser: TemporalFrequencyParser,
): Array<TemporalFrequency> {
	const date = parser.parse(parseRawTemporalValue(item));
	if (date === null) return [];
	return [
		{
			absolute: item.frq ?? 0,
			relative: item.reltt ?? 0,
			date,
		},
	];
}

function countUnparseableTemporalValues(data: FreqMlResponse, parser: TemporalFrequencyParser) {
	return (
		data.Blocks?.[0]?.Items?.filter((item) => parser.parse(parseRawTemporalValue(item)) === null)
			.length ?? 0
	);
}

function parseRawTemporalValue(item: FreqMlItem) {
	return item.Word?.map(({ n }) => n ?? "").join("") ?? "";
}

function createSeriesName(query: CorpusQuery) {
	return `${query.type}: ${query.userInput} (${query.corpus}${
		query.subCorpus ? ` / ${query.subCorpus})` : ")"
	}`;
}

function getFrequencyValue(frequency: TemporalFrequency, selectedMode: FrequencyMode) {
	return selectedMode === "relative" ? frequency.relative : frequency.absolute;
}

function createSampleAdjustedTemporalSeries(
	query: CorpusQuery,
	frequencies: Array<TemporalFrequency>,
	selectedMode: FrequencyMode,
): TemporalFrequencySeries {
	return {
		name: createSeriesName(query),
		data: applySampleRatio(
			createTemporalFrequencyPoints(frequencies, selectedMode),
			query.SampleRatio,
		),
		color: query.color,
	};
}

function createTemporalFrequencyPoints(
	frequencies: Array<TemporalFrequency>,
	selectedMode: FrequencyMode,
): Array<TemporalFrequencyPoint> {
	return [...frequencies]
		.sort((a, b) => a.date.getTime() - b.date.getTime())
		.map((frequency) => [frequency.date.getTime(), getFrequencyValue(frequency, selectedMode)]);
}

function applySampleRatio<TYear extends string | number>(
	points: Array<[TYear, number]>,
	sampleRatio: number,
): Array<[TYear, number]> {
	return points.map(([year, value]) => [year, value * (sampleRatio / 100)]);
}

const series = computed(() =>
	activeQueries.value.flatMap((query, index) => {
		const frequencies = temporalFrequencies.value[index];
		const data = frequencyData.value[index];
		const parser = temporalParsers.value[index];
		if (!frequencies || !data || !parser || parser.error) return [];

		return [createSampleAdjustedTemporalSeries(query, frequencies, mode.value)];
	}),
);

const intervalseries = computed(() =>
	series.value.map((querySeries) => ({
		...querySeries,
		data: groupTemporalFrequencyPoints(querySeries.data, interval.value, reverse.value).map(
			(item) => formatTemporalFrequencyInterval(item, bucketUnit.value, locale.value),
		),
	})),
);

function formatTemporalDomainValue(value: string | number) {
	return typeof value === "number"
		? formatTemporalTimestamp(value, bucketUnit.value, locale.value)
		: value;
}

function formatTemporalUnit(unit: TemporalUnit, count: number) {
	return t(`TemporalFrequencyDistribution.units.${unit}`, count);
}

function toggleSourceTable() {
	expand.value = !expand.value;
}
</script>

<template>
	<Card>
		<CardHeader v-if="showHeader">
			<CardTitle>{{ t("TemporalFrequencyDistribution.title") }}</CardTitle>
			<CardDescription>{{ t("TemporalFrequencyDistribution.description") }}</CardDescription>
		</CardHeader>

		<CardContent class="space-y-6">
			<div v-if="missingMappingQueries.length > 0" class="rounded-md border p-4 text-sm">
				<p class="font-medium">
					{{ t("TemporalFrequencyDistribution.mapping.missingTitle") }}
				</p>
				<p class="mt-1 text-muted-foreground">
					{{ t("TemporalFrequencyDistribution.mapping.missingDescription") }}
				</p>
				<ul class="mt-3 list-disc pl-5">
					<li v-for="query in missingMappingQueries" :key="`${query.noske}-${query.corpus}`">
						{{
							t("TemporalFrequencyDistribution.mapping.corpusOnNoske", {
								corpus: query.corpus,
								noske: query.noske,
							})
						}}
					</li>
				</ul>
			</div>
			<div v-if="invalidMappingQueries.length > 0" class="rounded-md border p-4 text-sm">
				<p class="font-medium">
					{{ t("TemporalFrequencyDistribution.mapping.invalidTitle") }}
				</p>
				<p class="mt-1 text-muted-foreground">
					{{ t("TemporalFrequencyDistribution.mapping.invalidDescription") }}
				</p>
				<ul class="mt-3 list-disc pl-5">
					<li v-for="query in invalidMappingQueries" :key="`${query.noske}-${query.corpus}`">
						{{
							t("TemporalFrequencyDistribution.mapping.corpusOnNoske", {
								corpus: query.corpus,
								noske: query.noske,
							})
						}}
					</li>
				</ul>
			</div>

			<template v-if="queryableQueryCount > 0">
				<div v-if="interactive" class="space-y-3" aria-labelledby="temporal-time-series-settings">
					<div>
						<h3 id="temporal-time-series-settings" class="font-medium">
							{{ t("TemporalFrequencyDistribution.settings.timeSeriesTitle") }}
						</h3>
						<p class="text-sm text-muted-foreground">
							{{ t("TemporalFrequencyDistribution.settings.timeSeriesDescription") }}
						</p>
					</div>
					<Toolbar :aria-label="t('TemporalFrequencyDistribution.toolbar.timeSeries')">
						<div class="inline-flex min-w-0 items-center gap-1.5">
							<Label class="sr-only">{{
								t("TemporalFrequencyDistribution.labels.frequencyMode")
							}}</Label>
							<ToolbarToggleGroup
								v-model="mode"
								class="shrink-0"
								size="sm"
								type="single"
								:aria-label="t('TemporalFrequencyDistribution.labels.frequencyMode')"
							>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger as-child>
											<ToolbarToggleItem value="absolute" :aria-label="t('absolute')">
												<Hash />
												<span>{{ t("absolute") }}</span>
											</ToolbarToggleItem>
										</TooltipTrigger>
										<TooltipContent>
											{{ t("TemporalFrequencyDistribution.tooltips.absoluteMode") }}
										</TooltipContent>
									</Tooltip>
									<Tooltip>
										<TooltipTrigger as-child>
											<ToolbarToggleItem value="relative" :aria-label="t('relative')">
												<Percent />
												<span>{{ t("relative") }}</span>
											</ToolbarToggleItem>
										</TooltipTrigger>
										<TooltipContent>
											{{ t("TemporalFrequencyDistribution.tooltips.relativeMode") }}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</ToolbarToggleGroup>
						</div>
						<ToolbarSeparator />
						<div class="inline-flex min-w-0 items-center gap-1.5">
							<CalendarDays class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
							<Label for="temporal-bucket-unit" class="sr-only">{{
								t("TemporalFrequencyDistribution.labels.timeUnit")
							}}</Label>
							<Select v-model="bucketUnit">
								<SelectTrigger id="temporal-bucket-unit" class="h-8 w-[8.5rem] min-w-0">
									<SelectValue :placeholder="t('TemporalFrequencyDistribution.labels.timeUnit')" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem
										v-for="option of bucketUnitOptions"
										:key="option.value"
										:value="option.value"
									>
										{{ option.label }}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<ToolbarSeparator />
						<div class="inline-flex min-w-0 items-center gap-1.5">
							<CalendarRange class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
							<Label for="temporal-range-start" class="sr-only">{{
								t("TemporalFrequencyDistribution.labels.startDate")
							}}</Label>
							<Input
								id="temporal-range-start"
								v-model="rangeStart"
								class="h-8 w-[9.25rem] min-w-0"
								type="date"
							/>
						</div>
						<div class="inline-flex min-w-0 items-center gap-1.5">
							<Label for="temporal-range-end" class="sr-only">{{
								t("TemporalFrequencyDistribution.labels.endDate")
							}}</Label>
							<Input
								id="temporal-range-end"
								v-model="rangeEnd"
								class="h-8 w-[9.25rem] min-w-0"
								type="date"
							/>
						</div>
						<p v-if="!selectedDateRange" class="basis-full text-sm text-destructive" role="alert">
							{{ t("TemporalFrequencyDistribution.errors.invalidRange") }}
						</p>
					</Toolbar>
				</div>
				<div
					v-for="(query, index) of activeQueries"
					v-show="temporalParsers[index] && !temporalParsers[index]?.error"
					:key="query.id"
				>
					<QueryDisplay
						:loading="temporalFrequenciesLoading[index]"
						:query="query"
						:query-key="queryDescriptors[index]?.queryKey"
					/>
					<p v-if="normalizationWarnings[index]" class="mt-1 text-xs text-muted-foreground">
						{{
							t(
								"TemporalFrequencyDistribution.warnings.parseExcluded",
								normalizationWarnings[index],
							)
						}}
					</p>
					<p
						v-if="temporalFrequenciesErrors[index]"
						class="mt-1 text-sm text-destructive"
						role="alert"
					>
						{{ temporalFrequenciesErrors[index] }}
					</p>
				</div>
				<Chart
					chart-type="line"
					class="h-96"
					domain-type="temporal"
					:domain-value-formatter="formatTemporalDomainValue"
					:series="series"
					:title="`${series.length} ${t('queries')}`"
					:y-axis="t('sources')"
				></Chart>

				<CardHeader class="px-0">
					<CardTitle>
						{{
							t("TemporalFrequencyDistribution.intervalChart.title", {
								count: interval,
								unit: formatTemporalUnit(bucketUnit, interval),
							})
						}}
					</CardTitle>
					<CardDescription>{{
						t("TemporalFrequencyDistribution.intervalChart.description")
					}}</CardDescription>
				</CardHeader>

				<div v-if="interactive" class="space-y-3" aria-labelledby="temporal-interval-settings">
					<div>
						<h3 id="temporal-interval-settings" class="font-medium">
							{{ t("TemporalFrequencyDistribution.settings.intervalTitle") }}
						</h3>
						<p class="text-sm text-muted-foreground">
							{{ t("TemporalFrequencyDistribution.settings.intervalDescription") }}
						</p>
					</div>
					<Toolbar :aria-label="t('TemporalFrequencyDistribution.toolbar.interval')">
						<CalendarRange class="mx-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
						<div class="inline-flex min-w-0 items-center gap-1.5">
							<Label for="temporal-interval" class="sr-only">{{
								t("TemporalFrequencyDistribution.labels.intervalSize")
							}}</Label>
							<Select v-model="interval" :aria-label="t('interval')">
								<SelectTrigger id="temporal-interval" class="h-8 w-[8.5rem] min-w-0">
									<SelectValue :placeholder="t('interval')" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem
										v-for="option of intervalSizeOptions"
										:key="option.value"
										:value="option.value"
									>
										{{ option.label }}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<ToolbarSeparator />
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger as-child>
									<ToolbarToggleGroup
										v-model="intervalDirection"
										size="sm"
										type="single"
										:aria-label="t('TemporalFrequencyDistribution.labels.groupingDirection')"
									>
										<ToolbarToggleItem
											value="forward"
											:aria-label="t('TemporalFrequencyDistribution.labels.groupingDirection')"
										>
											<CalendarRange />
										</ToolbarToggleItem>
										<ToolbarToggleItem
											value="reverse"
											:aria-label="t('TemporalFrequencyDistribution.labels.groupFromEnd')"
										>
											<CalendarDays />
											<span>{{ t("TemporalFrequencyDistribution.labels.groupFromEnd") }}</span>
										</ToolbarToggleItem>
									</ToolbarToggleGroup>
								</TooltipTrigger>
								<TooltipContent>
									{{ t("TemporalFrequencyDistribution.tooltips.groupFromEnd") }}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</Toolbar>
				</div>

				<Chart
					chart-type="bar"
					class="h-96"
					:series="intervalseries"
					:title="`${intervalseries.length} ${t('queries')}`"
					:y-axis="t('sources')"
				></Chart>
			</template>
		</CardContent>

		<Collapsible v-if="showSourceData" v-model:open="expand">
			<CollapsibleContent class="px-6 pb-6">
				<DataDisplaySourceTable
					:data="temporalFrequencies"
					datatype="yearlyFrequencies"
					:loading="temporalFrequenciesLoading"
					:queries="activeQueries"
				/>
			</CollapsibleContent>
		</Collapsible>

		<Separator v-if="showSourceData" />

		<CardFooter v-if="showSourceData && interactive">
			<Toolbar :aria-label="t('TemporalFrequencyDistribution.toolbar.sourceData')">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger as-child>
							<ToolbarButton
								:aria-label="!expand ? t('ShowData') : t('HideData')"
								:aria-pressed="expand"
								type="button"
								variant="outline"
								@click="toggleSourceTable"
							>
								<Rows3 />
								<span>{{ !expand ? t("ShowData") : t("HideData") }}</span>
							</ToolbarButton>
						</TooltipTrigger>
						<TooltipContent>
							{{ t("TemporalFrequencyDistribution.tooltips.sourceData") }}
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</Toolbar>
		</CardFooter>
	</Card>
</template>
