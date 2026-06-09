<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";

import type { components } from "~/lib/noske-types";

type FreqMlResponse = components["schemas"]["11_freqml"];
type FreqMlBlock = NonNullable<FreqMlResponse["Blocks"]>[number];
type FreqMlItem = NonNullable<FreqMlBlock["Items"]>[number];

const t = useTranslations();
const queryStore = useQueryStore();
const { queries } = storeToRefs(queryStore);

const noskeId = computed(() => queries.value[0]?.noske ?? null);
const { client } = useNoskeClient(noskeId);

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

const firstChartYear = 1986;
const lastChartYear = 2024;
const intervalOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10];

const mode = ref<FrequencyMode>("relative");
const interval = ref(2);
const reverse = ref(false);
const expand = ref(false);
const yearlyFrequencies: Ref<Array<Array<YearlyFrequency>>> = ref([]);
const yearlyFrequenciesLoading: Ref<Array<boolean>> = ref([]);

const q = computed(() =>
	queries.value.map((query, index) => {
		const queryKey = [
			"get-yearly-frequencies",
			noskeId.value,
			query.corpus,
			query.subCorpus,
			JSON.stringify(queryStore.getQueryWithFacetting(query)),
		] as const;
		return {
			queryKey,
			enabled: Boolean(client.value),
			queryFn: async () => {
				const activeClient = client.value;
				if (!activeClient) throw new Error("NoSketch client is not ready yet.");
				yearlyFrequenciesLoading.value[index] = true;
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
								ml1attr: "doc.year",
								ml1ctx: "0~0 > 0",
								json: JSON.stringify({
									concordance_query: queryStore.getQueryWithFacetting(query),
								}),
							},
						},
					});
					if (error) throw error;
					return data;
				} catch (error) {
					yearlyFrequenciesLoading.value[index] = false;
					throw error;
				}
			},
			select: (data: FreqMlResponse) => {
				yearlyFrequencies.value[index] = appendMissingYearFrequencies(
					parseYearlyFrequencies(data),
					createYearRange(firstChartYear, lastChartYear),
				);
				yearlyFrequenciesLoading.value[index] = false;
			},
		};
	}),
);

useQueries({ queries: q });

function parseYearlyFrequencies(data: FreqMlResponse): Array<YearlyFrequency> {
	return data.Blocks?.[0]?.Items?.map(parseYearlyFrequencyItem) ?? [];
}

function parseYearlyFrequencyItem(item: FreqMlItem): YearlyFrequency {
	return {
		absolute: item.frq ?? 0,
		relative: item.reltt ?? 0,
		year: parseYear(item),
	};
}

function parseYear(item: FreqMlItem) {
	return Number(item.Word?.map(({ n }) => n ?? "").join("") ?? 0);
}

function createYearRange(firstYear: number, lastYear: number) {
	return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
}

function appendMissingYearFrequencies(
	frequencies: Array<YearlyFrequency>,
	years: Array<number>,
): Array<YearlyFrequency> {
	const frequencyYears = new Set(frequencies.map((frequency) => frequency.year));
	const missingFrequencies = years
		.filter((year) => !frequencyYears.has(year))
		.map((year) => ({
			year,
			absolute: 0,
			relative: 0,
		}));

	return [...frequencies, ...missingFrequencies];
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
	queries.value.flatMap((query, index) => {
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
			<div class="flex max-w-7xl">
				<ToggleGroup v-model="mode" class="flex w-full" type="single">
					<ToggleGroupItem value="absolute">{{ t("absolute") }}</ToggleGroupItem>
					<ToggleGroupItem value="relative">{{ t("relative") }}</ToggleGroupItem>
				</ToggleGroup>
			</div>
			<div v-for="(query, index) of queries" :key="query.id">
				<QueryDisplay
					:loading="yearlyFrequenciesLoading[index]"
					:query="query"
					:query-key="q[index]?.queryKey"
				/>
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
					<Label for="yearly-interval">Interval</Label>
					<Select v-model="interval" :aria-label="t('interval')">
						<SelectTrigger id="yearly-interval" class="min-w-60">
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
					<Checkbox id="yearly-reverse" v-model:checked="reverse" />
					<Label for="yearly-reverse">Reverse</Label>
				</div>
			</div>

			<Chart
				chart-type="bar"
				class="h-96"
				:series="intervalseries"
				:title="`${intervalseries.length} ${t('queries')}`"
				:y-axis="t('sources')"
			></Chart>
		</CardContent>

		<Collapsible v-model:open="expand">
			<CollapsibleContent class="px-6 pb-6">
				<DataDisplaySourceTable
					:data="yearlyFrequencies"
					datatype="yearlyFrequencies"
					:loading="yearlyFrequenciesLoading"
					:queries="queries"
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
