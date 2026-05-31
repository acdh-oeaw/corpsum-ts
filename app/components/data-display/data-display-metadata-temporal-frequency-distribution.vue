<script lang="ts" setup>
import { storeToRefs } from "pinia";

import type { components } from "~/lib/noske-types";
import {
	type CorpusMetadataMappingResponse,
	type TemporalFrequencyDistributionSettings,
	defaultTemporalFrequencyDistributionSettings,
	normalizeTemporalFrequencyDistributionSettings,
} from "~/lib/visualization-types";

type FreqMlResponse = components["schemas"]["11_freqml"];
type FreqMlBlock = NonNullable<FreqMlResponse["Blocks"]>[number];
type FreqMlItem = NonNullable<FreqMlBlock["Items"]>[number];

interface YearlyFrequency {
	year: number;
	absolute: number;
	relative: number;
}

type FrequencyMode = "absolute" | "relative";
type FrequencyPoint = [year: number, value: number];
type IntervalFrequencyPoint = [yearRange: string, value: number];

interface YearlyFrequencySeries<TPoint extends FrequencyPoint | IntervalFrequencyPoint> {
	name: string;
	data: Array<TPoint>;
	color: string;
}

interface MappingLookupResponse {
	resolved: CorpusMetadataMappingResponse | null;
	user: CorpusMetadataMappingResponse | null;
	default: CorpusMetadataMappingResponse | null;
	canEditDefault: boolean;
}

const props = withDefaults(
	defineProps<{
		queries?: Array<CorpusQuery>;
		settings?: Partial<TemporalFrequencyDistributionSettings>;
	}>(),
	{
		queries: undefined,
		settings: undefined,
	},
);

const emit = defineEmits<{
	"update:settings": [settings: TemporalFrequencyDistributionSettings];
}>();

const t = useTranslations();
const queryStore = useQueryStore();
const { queries: storeQueries } = storeToRefs(queryStore);

const activeQueries = computed(() => props.queries ?? storeQueries.value);
const normalizedSettings = computed(() =>
	normalizeTemporalFrequencyDistributionSettings(props.settings),
);

const intervalOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const mode = ref<FrequencyMode>(normalizedSettings.value.mode);
const interval = ref(normalizedSettings.value.intervalSize);
const reverse = ref(normalizedSettings.value.reverseIntervals);
const expand = ref(normalizedSettings.value.sourceTableExpanded);

watch(
	normalizedSettings,
	(value) => {
		mode.value = value.mode;
		interval.value = value.intervalSize;
		reverse.value = value.reverseIntervals;
		expand.value = value.sourceTableExpanded;
	},
	{ deep: true },
);

watch([mode, interval, reverse, expand], () => {
	emit("update:settings", {
		type: defaultTemporalFrequencyDistributionSettings.type,
		mode: mode.value,
		yearRange: normalizedSettings.value.yearRange,
		intervalSize: interval.value,
		reverseIntervals: reverse.value,
		sourceTableExpanded: expand.value,
	});
});

const mappingLookupKey = computed(() =>
	activeQueries.value
		.map((query) => `${query.noske ?? ""}:${query.corpus}`)
		.sort()
		.join("|"),
);

const { data: mappingLookups, refresh: refreshMappings } = await useAsyncData<
	Array<MappingLookupResponse>
>(
	() => `temporal-metadata-mappings:${mappingLookupKey.value}`,
	async () => {
		const requestFetch = import.meta.server ? (useRequestFetch() as typeof $fetch) : $fetch;
		return Promise.all(
			activeQueries.value.map((query) =>
				requestFetch<MappingLookupResponse>("/api/corpus-metadata-mappings", {
					query: {
						noske: query.noske,
						corpus: query.corpus,
						semantic: "temporal",
					},
				}),
			),
		);
	},
	{
		default: () => [],
		watch: [mappingLookupKey],
	},
);

const mappings = computed(() => mappingLookups.value.map((entry) => entry.resolved));
const missingMappingQueries = computed(() =>
	activeQueries.value.filter((_, index) => !mappings.value[index]),
);
const canQuery = computed(
	() => activeQueries.value.length > 0 && missingMappingQueries.value.length === 0,
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
			JSON.stringify(queryStore.getQueryWithFacetting(query)),
		] as const;
		return {
			queryKey,
			noske: query.noske ?? "",
			enabled: canQuery.value,
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
					concordance_query: queryStore.getQueryWithFacetting(query),
				}),
			},
		};
	}),
);

const queryResults = useNoskeFreqMlQueries(queryDescriptors);

const yearlyFrequencies = computed(() =>
	queryResults.value.map((result, index) => {
		const mapping = mappings.value[index];
		if (!mapping || !result.data) return [];
		return appendMissingYearFrequencies(
			parseYearlyFrequencies(result.data, mapping),
			createYearRange(
				normalizedSettings.value.yearRange.start,
				normalizedSettings.value.yearRange.end,
			),
		);
	}),
);

const yearlyFrequenciesLoading = computed(() =>
	queryResults.value.map((result) => result.isFetching || result.isLoading),
);
const mappingDrafts = ref<Record<string, string>>({});
const mappingErrors = ref<Record<string, string>>({});
const mappingSaving = ref<Record<string, boolean>>({});

watchEffect(() => {
	for (const [index, query] of activeQueries.value.entries()) {
		const key = createMappingDraftKey(query);
		if (mappingDrafts.value[key]) continue;
		const mapping = mappingLookups.value[index]?.resolved;
		mappingDrafts.value[key] = JSON.stringify(
			mapping
				? {
						attribute: mapping.attribute,
						parser: mapping.parser,
						valueMap: mapping.valueMap,
						label: mapping.label ?? "Temporal distribution",
						description: mapping.description ?? "",
					}
				: {
						attribute: "doc.year",
						parser: { mode: "year" },
						valueMap: {},
						label: "Temporal distribution",
						description: "",
					},
			null,
			2,
		);
	}
});

const normalizationWarnings = computed(() =>
	queryResults.value.map((result, index) => {
		const mapping = mappings.value[index];
		if (!mapping || !result.data) return 0;
		return countUnparseableTemporalValues(result.data, mapping);
	}),
);

const editableMappingQueries = computed(() =>
	activeQueries.value.filter((_, index) => Boolean(mappingLookups.value[index]?.resolved)),
);

function createMappingDraftKey(query: CorpusQuery) {
	return `${query.noske ?? ""}:${query.corpus}`;
}

async function saveMapping(query: CorpusQuery, index: number, forceUserCopy = false) {
	const key = createMappingDraftKey(query);
	const noske = query.noske;
	if (!noske) return;
	mappingErrors.value = { ...mappingErrors.value, [key]: "" };
	mappingSaving.value = { ...mappingSaving.value, [key]: true };
	try {
		const parsed = JSON.parse(mappingDrafts.value[key] ?? "{}") as Record<string, unknown>;
		const lookup = mappingLookups.value[index];
		const target = !forceUserCopy && lookup?.canEditDefault ? lookup.default : lookup?.user;
		const body = {
			noske,
			corpus: query.corpus,
			semantic: "temporal",
			scope: forceUserCopy || !lookup?.canEditDefault ? "user" : "default",
			attribute: parsed.attribute,
			parser: parsed.parser,
			valueMap: parsed.valueMap ?? {},
			label: parsed.label,
			description: parsed.description,
		};
		if (target) {
			await $fetch(`/api/corpus-metadata-mappings/${target._id}`, {
				method: "PATCH",
				body,
			});
		} else {
			await $fetch("/api/corpus-metadata-mappings", {
				method: "POST",
				body,
			});
		}
		await refreshMappings();
	} catch (error) {
		mappingErrors.value = {
			...mappingErrors.value,
			[key]: error instanceof Error ? error.message : "Could not save mapping.",
		};
	} finally {
		mappingSaving.value = { ...mappingSaving.value, [key]: false };
	}
}

function getMappingIndex(query: CorpusQuery) {
	return activeQueries.value.findIndex(
		(item) => item.noske === query.noske && item.corpus === query.corpus,
	);
}

function getMappingActionLabel(query: CorpusQuery) {
	const lookup = mappingLookups.value[getMappingIndex(query)];
	if (lookup?.user) return "Save private mapping";
	if (lookup?.canEditDefault) return "Save default mapping";
	return "Save private copy";
}

function parseYearlyFrequencies(
	data: FreqMlResponse,
	mapping: CorpusMetadataMappingResponse,
): Array<YearlyFrequency> {
	return data.Blocks?.[0]?.Items?.flatMap((item) => parseYearlyFrequencyItem(item, mapping)) ?? [];
}

function parseYearlyFrequencyItem(
	item: FreqMlItem,
	mapping: CorpusMetadataMappingResponse,
): Array<YearlyFrequency> {
	const year = parseTemporalYear(parseRawTemporalValue(item), mapping);
	if (year === null) return [];
	return [
		{
			absolute: item.frq ?? 0,
			relative: item.reltt ?? 0,
			year,
		},
	];
}

function countUnparseableTemporalValues(
	data: FreqMlResponse,
	mapping: CorpusMetadataMappingResponse,
) {
	return (
		data.Blocks?.[0]?.Items?.filter(
			(item) => parseTemporalYear(parseRawTemporalValue(item), mapping) === null,
		).length ?? 0
	);
}

function parseRawTemporalValue(item: FreqMlItem) {
	return item.Word?.map(({ n }) => n ?? "").join("") ?? "";
}

function parseTemporalYear(
	rawValue: string,
	mapping: CorpusMetadataMappingResponse,
): number | null {
	const normalized = mapping.valueMap[rawValue] ?? rawValue;
	if (mapping.parser.mode === "year") {
		const year = Number(normalized);
		return Number.isInteger(year) ? year : null;
	}
	if (mapping.parser.mode === "date") {
		const date = new Date(normalized);
		const year = date.getUTCFullYear();
		return Number.isInteger(year) && !Number.isNaN(date.getTime()) ? year : null;
	}
	if (!mapping.parser.pattern) return null;
	const match = new RegExp(mapping.parser.pattern, "u").exec(normalized);
	const captured = match?.[1] ?? match?.groups?.year;
	if (!captured) return null;
	const year = Number(captured);
	return Number.isInteger(year) ? year : null;
}

function createYearRange(firstYear: number, lastYear: number) {
	return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
}

function appendMissingYearFrequencies(
	frequencies: Array<YearlyFrequency>,
	years: Array<number>,
): Array<YearlyFrequency> {
	const totalsByYear = new Map<number, YearlyFrequency>();
	for (const frequency of frequencies) {
		const current = totalsByYear.get(frequency.year) ?? {
			year: frequency.year,
			absolute: 0,
			relative: 0,
		};
		current.absolute += frequency.absolute;
		current.relative += frequency.relative;
		totalsByYear.set(frequency.year, current);
	}
	for (const year of years) {
		if (!totalsByYear.has(year)) {
			totalsByYear.set(year, { year, absolute: 0, relative: 0 });
		}
	}
	return [...totalsByYear.values()];
}

function createSeriesName(query: CorpusQuery) {
	return `${query.type}: ${query.userInput} (${query.corpus}${
		query.subCorpus ? ` / ${query.subCorpus})` : ")"
	}`;
}

function getFrequencyValue(frequency: YearlyFrequency, selectedMode: FrequencyMode) {
	return selectedMode === "relative" ? frequency.relative : frequency.absolute;
}

function createSampleAdjustedYearlySeries(
	query: CorpusQuery,
	frequencies: Array<YearlyFrequency>,
	selectedMode: FrequencyMode,
): YearlyFrequencySeries<FrequencyPoint> {
	return {
		name: createSeriesName(query),
		data: applySampleRatio(
			createYearlyFrequencyPoints(frequencies, selectedMode),
			query.SampleRatio,
		),
		color: query.color,
	};
}

function createYearlyFrequencyPoints(
	frequencies: Array<YearlyFrequency>,
	selectedMode: FrequencyMode,
): Array<FrequencyPoint> {
	return [...frequencies]
		.sort((a, b) => a.year - b.year)
		.map((frequency) => [frequency.year, getFrequencyValue(frequency, selectedMode)]);
}

function applySampleRatio<TYear extends string | number>(
	points: Array<[TYear, number]>,
	sampleRatio: number,
): Array<[TYear, number]> {
	return points.map(([year, value]) => [year, value * (sampleRatio / 100)]);
}

function groupFrequencyPointsIntoIntervals(
	points: Array<FrequencyPoint>,
	intervalSize: number,
	useReverseIntervals: boolean,
): Array<IntervalFrequencyPoint> {
	const intervalSource = useReverseIntervals ? [...points].reverse() : points;
	const fullIntervalCount = Math.floor(intervalSource.length / intervalSize);
	const intervals = Array.from({ length: fullIntervalCount }, (_, intervalIndex) => {
		const intervalPoints = intervalSource.slice(
			intervalIndex * intervalSize,
			(intervalIndex + 1) * intervalSize,
		);

		return createIntervalFrequencyPoint(intervalPoints);
	});

	return useReverseIntervals ? intervals.reverse() : intervals;
}

function createIntervalFrequencyPoint(points: Array<FrequencyPoint>): IntervalFrequencyPoint {
	const orderedYears = points.map(([year]) => year).sort((a, b) => a - b);
	const totalValue = points.reduce((sum, [, value]) => sum + value, 0);

	return [`${orderedYears[0]}-${orderedYears.at(-1)}`, totalValue];
}

const series = computed(() =>
	activeQueries.value.flatMap((query, index) => {
		const frequencies = yearlyFrequencies.value[index];
		if (!frequencies) return [];

		return [createSampleAdjustedYearlySeries(query, frequencies, mode.value)];
	}),
);

const intervalseries = computed(() =>
	series.value.map((querySeries) => ({
		...querySeries,
		data: groupFrequencyPointsIntoIntervals(querySeries.data, interval.value, reverse.value),
	})),
);
</script>

<template>
	<Card>
		<CardHeader>
			<CardTitle>{{ t("yearlyFrequencies") }}</CardTitle>
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
				<div
					v-for="query in missingMappingQueries"
					:key="`editor-${query.noske}-${query.corpus}`"
					class="mt-4 grid gap-2"
				>
					<Label :for="`mapping-${query.noske}-${query.corpus}`">
						{{ query.corpus }} temporal mapping
					</Label>
					<textarea
						:id="`mapping-${query.noske}-${query.corpus}`"
						v-model="mappingDrafts[createMappingDraftKey(query)]"
						class="min-h-44 rounded-md border bg-background p-3 font-mono text-xs"
					></textarea>
					<p v-if="mappingErrors[createMappingDraftKey(query)]" class="text-xs text-destructive">
						{{ mappingErrors[createMappingDraftKey(query)] }}
					</p>
					<Button
						class="w-fit"
						:disabled="mappingSaving[createMappingDraftKey(query)]"
						size="sm"
						type="button"
						@click="saveMapping(query, getMappingIndex(query))"
					>
						{{
							mappingSaving[createMappingDraftKey(query)] ? "Saving..." : "Save temporal mapping"
						}}
					</Button>
				</div>
				<Button class="mt-3" size="sm" type="button" variant="outline" @click="refreshMappings">
					Refresh mappings
				</Button>
			</div>

			<template v-else>
				<details v-if="editableMappingQueries.length > 0" class="rounded-md border p-4 text-sm">
					<summary class="cursor-pointer font-medium">Temporal metadata mappings</summary>
					<div
						v-for="query in editableMappingQueries"
						:key="`editable-${query.noske}-${query.corpus}`"
						class="mt-4 grid gap-2"
					>
						<Label :for="`editable-mapping-${query.noske}-${query.corpus}`">
							{{ query.corpus }} temporal mapping
						</Label>
						<textarea
							:id="`editable-mapping-${query.noske}-${query.corpus}`"
							v-model="mappingDrafts[createMappingDraftKey(query)]"
							class="min-h-44 rounded-md border bg-background p-3 font-mono text-xs"
						></textarea>
						<p v-if="mappingErrors[createMappingDraftKey(query)]" class="text-xs text-destructive">
							{{ mappingErrors[createMappingDraftKey(query)] }}
						</p>
						<div class="flex flex-wrap gap-2">
							<Button
								class="w-fit"
								:disabled="mappingSaving[createMappingDraftKey(query)]"
								size="sm"
								type="button"
								@click="saveMapping(query, getMappingIndex(query))"
							>
								{{
									mappingSaving[createMappingDraftKey(query)]
										? "Saving..."
										: getMappingActionLabel(query)
								}}
							</Button>
							<Button
								v-if="
									!mappingLookups[getMappingIndex(query)]?.user &&
									mappingLookups[getMappingIndex(query)]?.default
								"
								:disabled="mappingSaving[createMappingDraftKey(query)]"
								size="sm"
								type="button"
								variant="outline"
								@click="saveMapping(query, getMappingIndex(query), true)"
							>
								Save private copy
							</Button>
						</div>
					</div>
				</details>

				<div class="flex max-w-7xl">
					<ToggleGroup v-model="mode" class="flex w-full" type="single">
						<ToggleGroupItem value="absolute">{{ t("absolute") }}</ToggleGroupItem>
						<ToggleGroupItem value="relative">{{ t("relative") }}</ToggleGroupItem>
					</ToggleGroup>
				</div>
				<div v-for="(query, index) of activeQueries" :key="query.id">
					<QueryDisplay
						:loading="yearlyFrequenciesLoading[index]"
						:query="query"
						:query-key="queryDescriptors[index]?.queryKey"
					/>
					<p v-if="normalizationWarnings[index]" class="mt-1 text-xs text-muted-foreground">
						{{ normalizationWarnings[index] }} temporal value(s) could not be parsed and were
						excluded.
					</p>
				</div>
				<Chart
					chart-type="line"
					class="h-96"
					:series="series"
					:title="`${series.length} ${t('queries')}`"
					:y-axis="t('sources')"
				></Chart>

				<CardHeader class="px-0">
					<CardTitle>{{ `${t("yearlyFrequenciesPer")}${interval} years` }}</CardTitle>
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
									{{ intervalOption }} years
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div class="flex items-center gap-2">
						<Checkbox id="temporal-reverse" v-model:checked="reverse" />
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
					:data="yearlyFrequencies"
					datatype="yearlyFrequencies"
					:loading="yearlyFrequenciesLoading"
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
