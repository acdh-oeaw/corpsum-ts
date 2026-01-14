<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";

import type { components } from "~/lib/noske-types";

type FreqMlResponse = components["schemas"]["11_freqml"];

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

const mode = ref("relative");
const interval = ref(2);
const reverse = ref(false);
const expand = ref(false);
const yearlyFrequencies: Ref<Array<Array<YearlyFrequency>>> = ref([]);
const yearlyFrequenciesLoading: Ref<Array<boolean>> = ref([]);

const q = computed(() =>
	queries.value.map((query, index) => {
		return {
			queryKey: [
				"get-yearly-frequencies",
				noskeId.value,
				query.corpus,
				query.subCorpus,
				JSON.stringify(queryStore.getQueryWithFacetting(query)),
			] as const,
			enabled: Boolean(client.value),
			queryFn: async () => {
				const activeClient = client.value;
				if (!activeClient) throw new Error("NoSketch client is not ready yet.");
				yearlyFrequenciesLoading.value[index] = true;
				const { data, error } = await activeClient.GET("/search/freqml", {
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
							json: JSON.stringify({ concordance_query: queryStore.getQueryWithFacetting(query) }),
						},
					},
				});
				if (error) throw error;
				return data;
			},
			select: (data: FreqMlResponse) => {
				yearlyFrequencies.value[index] =
					data.Blocks?.map(
						(block) =>
							block.Items?.map((item) => {
								return {
									absolute: item.frq!,
									relative: item.reltt!,
									year: Number(item.Word?.reduce((acc, cur) => acc + (cur.n ?? ""), "")),
								};
							}) ?? [],
					)[0] ?? [];
				const years = Array.from({ length: 2024 - 1986 + 1 }, (_, i) => 1986 + i);
				years.forEach((year) => {
					if (yearlyFrequencies.value[index]?.filter((item) => item.year === year).length === 0) {
						yearlyFrequencies.value[index].push({
							year,
							absolute: 0,
							relative: 0,
						});
					}
				});
				yearlyFrequenciesLoading.value[index] = false;
			},
		};
	}),
);

useQueries({ queries: q });

const sumInIntervals = function (
	numbers: Array<Array<number>>,
	intervalSize: number,
	reverseOrder: boolean,
) {
	const results = [];
	const fullIntervals = Math.floor(numbers.length / intervalSize);

	if (reverseOrder) {
		for (let i = 0; i < fullIntervals; i++) {
			let sum = 0;
			let start;
			let finish;
			for (let j = 0; j < intervalSize; j++) {
				if (j === 0) finish = numbers[numbers.length - 1 - (i * intervalSize + j)]![0];
				if (j === intervalSize - 1)
					start = numbers[numbers.length - 1 - (i * intervalSize + j)]![0];
				sum += numbers[numbers.length - 1 - (i * intervalSize + j)]![1]!;
			}
			results.push([`${start}-${finish}`, sum]);
		}
		results.reverse();
	} else {
		for (let i = 0; i < fullIntervals; i++) {
			let sum = 0;
			let start;
			let finish;
			for (let j = 0; j < intervalSize; j++) {
				if (j === 0) start = numbers[i * intervalSize + j]![0];
				if (j === intervalSize - 1) finish = numbers[i * intervalSize + j]![0];
				sum += numbers[i * intervalSize + j]![1]!;
			}
			results.push([`${start}-${finish}`, sum]);
		}
	}
	return results;
};

const applySampleSize = function (numbers: Array<Array<number>>, sampleSize: number) {
	const results = [...numbers];
	for (const entry of results) {
		if (entry && Array.isArray(entry)) entry[1] = entry[1]! * (sampleSize / 100);
	}
	return results;
};

const series = computed(() => {
	const result = queries.value
		.filter((query, i) => yearlyFrequencies.value[i])
		.map((query, index) => ({
			name: `${query.type}: ${query.userInput} (${query.corpus}${
				query.subCorpus ? ` / ${query.subCorpus})` : ")"
			}`,
			data: (yearlyFrequencies.value[index] ?? [])
				.sort((a, b) => b.year - a.year)
				.map((point) => [point.year, mode.value === "relative" ? point.relative : point.absolute]),
			color: query.color,
		}));
	result.forEach((entry, i) => {
		if (entry.data)
			result[i]!.data = applySampleSize(entry.data.reverse(), queries.value[i]!.SampleRatio);
	});
	return result;
});

const intervalseries = computed(() => {
	const result = queries.value
		.filter((query, i) => yearlyFrequencies.value[i])
		.map((query, index) => ({
			name: `${query.type}: ${query.userInput} (${query.corpus}${
				query.subCorpus ? ` / ${query.subCorpus})` : ")"
			}`,
			data: (yearlyFrequencies.value[index] ?? [])
				.sort((a, b) => b.year - a.year)
				.map((point) => [point.year, mode.value === "relative" ? point.relative : point.absolute]),
			color: query.color,
		}));
	result.forEach((entry, i) => {
		if (entry.data) {
			// @ts-expect-error highcharts internal usage
			result[i]!.data = sumInIntervals(entry.data.reverse(), interval.value, reverse.value);
			result[i]!.data = applySampleSize(entry.data, queries.value[i]!.SampleRatio);
		}
	});
	return result;
});
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
				<QueryDisplay :loading="yearlyFrequenciesLoading[index]" :query="query" />
			</div>
			<HighCharts
				:options="{
					series,
					title: {
						text: `${series.length} ${t('queries')}`,
						align: 'center',
					},
					yAxis: {
						title: {
							text: t('sources'),
						},
					},
				}"
			/>

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
							<SelectItem :value="2">2 years</SelectItem>
							<SelectItem :value="3">3 years</SelectItem>
							<SelectItem :value="4">4 years</SelectItem>
							<SelectItem :value="5">5 years</SelectItem>
							<SelectItem :value="6">6 years</SelectItem>
							<SelectItem :value="7">7 years</SelectItem>
							<SelectItem :value="8">8 years</SelectItem>
							<SelectItem :value="9">9 years</SelectItem>
							<SelectItem :value="10">10 years</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div class="flex items-center gap-2">
					<Checkbox id="yearly-reverse" v-model:checked="reverse" />
					<Label for="yearly-reverse">Reverse</Label>
				</div>
			</div>

			<HighCharts
				:options="{
					chart: {
						type: 'column',
					},
					series: intervalseries,
					title: {
						text: `${intervalseries.length} ${t('queries')}`,
						align: 'center',
					},
					yAxis: {
						title: {
							text: t('sources'),
						},
					},
					xAxis: {
						categories: intervalseries[0]?.data?.map(([year]) => year),
					},
				}"
			/>
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
