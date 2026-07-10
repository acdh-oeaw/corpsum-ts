<script lang="ts" setup>
import {
	type CorpusMetadataMappingResponse,
	type TemporalFrequencyDistributionSettings,
	type TemporalUnit,
	defaultTemporalFrequencyDistributionSettings,
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
	getAllowedTemporalBucketUnits,
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
	}>(),
	{
		metadataMappings: undefined,
		settings: undefined,
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

watch(
	normalizedSettings,
	(value) => {
		mode.value = value.mode;
		bucketUnit.value = value.bucketUnit;
		interval.value = value.intervalSize;
		reverse.value = value.reverseIntervals;
		expand.value = value.sourceTableExpanded;
	},
	{ deep: true },
);

watch([mode, bucketUnit, interval, reverse, expand], () => {
	emit("update:settings", {
		type: defaultTemporalFrequencyDistributionSettings.type,
		mode: mode.value,
		bucketUnit: bucketUnit.value,
		dateRange: normalizedSettings.value.dateRange,
		intervalSize: interval.value,
		reverseIntervals: reverse.value,
		sourceTableExpanded: expand.value,
	});
});

const mappings = computed(() => props.metadataMappings ?? []);
const availableBucketUnits = computed(() =>
	getAllowedTemporalBucketUnits(
		mappings.value.flatMap((mapping) => (mapping ? [getTemporalSourceUnit(mapping)] : [])),
	),
);
watchEffect(() => {
	if (!availableBucketUnits.value.includes(bucketUnit.value)) {
		bucketUnit.value = availableBucketUnits.value.at(-1) ?? "year";
	}
});
const dateRange = computed(() => ({
	start: new Date(normalizedSettings.value.dateRange.start),
	end: new Date(normalizedSettings.value.dateRange.end),
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
			enabled: Boolean(mapping) && !temporalParsers.value[index]?.error,
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

const temporalFrequencies = computed(() =>
	queryResults.value.map((result, index) => {
		const parser = temporalParsers.value[index];
		if (!parser || parser.error || !result.data) return [];
		return aggregateTemporalFrequencies(
			parseTemporalFrequencies(result.data, parser),
			dateRange.value,
			bucketUnit.value,
		);
	}),
);

const temporalFrequenciesLoading = computed(() =>
	queryResults.value.map((result) => result.isFetching || result.isLoading),
);
const temporalFrequenciesErrors = computed(() =>
	queryResults.value.map((result, index) => {
		const parserError = temporalParsers.value[index]?.error;
		if (parserError) return parserError;
		return result.isError ? "The temporal frequency data could not be loaded." : null;
	}),
);

const normalizationWarnings = computed(() =>
	queryResults.value.map((result, index) => {
		const parser = temporalParsers.value[index];
		if (!parser || parser.error || !result.data) return 0;
		return countUnparseableTemporalValues(result.data, parser);
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
		const result = queryResults.value[index];
		const parser = temporalParsers.value[index];
		if (!frequencies || !result?.data || !parser || parser.error) return [];

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
</script>

<template>
	<Card>
		<CardHeader>
			<CardTitle>Temporal frequencies</CardTitle>
			<CardDescription>{{ t("yearlyFrequenciesDesc") }}</CardDescription>
		</CardHeader>

		<CardContent class="space-y-6">
			<div v-if="missingMappingQueries.length > 0" class="rounded-md border p-4 text-sm">
				<p class="font-medium">Temporal metadata mapping required</p>
				<p class="mt-1 text-muted-foreground">
					Create a temporal mapping for each corpus before this visualization can query NoSketch
					metadata.
				</p>
				<ul class="mt-3 list-disc pl-5">
					<li v-for="query in missingMappingQueries" :key="`${query.noske}-${query.corpus}`">
						{{ query.corpus }} on {{ query.noske }}
					</li>
				</ul>
			</div>
			<div v-if="invalidMappingQueries.length > 0" class="rounded-md border p-4 text-sm">
				<p class="font-medium">Invalid temporal metadata mapping</p>
				<p class="mt-1 text-muted-foreground">
					Correct the regular expression for each affected corpus before loading its data.
				</p>
				<ul class="mt-3 list-disc pl-5">
					<li v-for="query in invalidMappingQueries" :key="`${query.noske}-${query.corpus}`">
						{{ query.corpus }} on {{ query.noske }}
					</li>
				</ul>
			</div>

			<template v-if="queryableQueryCount > 0">
				<div class="flex max-w-7xl flex-wrap gap-3">
					<ToggleGroup v-model="mode" class="flex w-full" type="single">
						<ToggleGroupItem value="absolute">{{ t("absolute") }}</ToggleGroupItem>
						<ToggleGroupItem value="relative">{{ t("relative") }}</ToggleGroupItem>
					</ToggleGroup>
					<div class="space-y-1">
						<Label for="temporal-bucket-unit">Time unit</Label>
						<Select v-model="bucketUnit">
							<SelectTrigger id="temporal-bucket-unit" class="min-w-60">
								<SelectValue placeholder="Time unit" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem v-for="unit of availableBucketUnits" :key="unit" :value="unit">
									{{ unit }}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
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
						{{ normalizationWarnings[index] }} temporal value(s) could not be parsed and were
						excluded.
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
						{{ `Temporal frequencies per ${interval} ${bucketUnit}${interval === 1 ? "" : "s"}` }}
					</CardTitle>
					<CardDescription>{{ t("yearlyFrequenciesDesc") }}</CardDescription>
				</CardHeader>

				<div class="flex flex-wrap items-center gap-3">
					<div class="space-y-1">
						<Label for="temporal-interval">Interval</Label>
						<Select v-model="interval" :aria-label="t('interval')">
							<SelectTrigger id="temporal-interval" class="min-w-60">
								<SelectValue :placeholder="t('interval')" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem
									v-for="intervalOption of intervalOptions"
									:key="intervalOption"
									:value="intervalOption"
								>
									{{ intervalOption }} {{ bucketUnit }}s
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div class="flex items-center gap-2">
						<Checkbox id="temporal-reverse" v-model="reverse" />
						<Label for="temporal-reverse">Reverse</Label>
					</div>
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

		<Collapsible v-model:open="expand">
			<CollapsibleContent class="px-6 pb-6">
				<DataDisplaySourceTable
					:data="temporalFrequencies"
					datatype="yearlyFrequencies"
					:loading="temporalFrequenciesLoading"
					:queries="activeQueries"
				/>
			</CollapsibleContent>
		</Collapsible>

		<Separator />

		<CardFooter>
			<Button size="sm" variant="outline" @click="expand = !expand">
				{{ !expand ? t("ShowData") : t("HideData") }}
			</Button>
		</CardFooter>
	</Card>
</template>
