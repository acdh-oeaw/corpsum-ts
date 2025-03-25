<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";

import type { Type11Freqml } from "~/lib/api-client";

const t = useTranslations("Corpsum");
const queryStore = useQueryStore();
const { queries } = storeToRefs(queryStore);

const api = useApiClient();

interface IyearlyFrequency {
	year: number;
	absolute: number;
	relative: number;
}

const mode = ref("relative");
const interval = ref(1);
const expand = ref(false);
const yearlyFrequencies: Ref<Array<Array<IyearlyFrequency>>> = ref([]);
const yearlyFrequenciesLoading: Ref<Array<boolean>> = ref([]);

const q = computed(() =>
	queries.value.map((query, index) => {
		return {
			queryKey: [
				"get-yearly-frequencies",
				query.corpus,
				query.subCorpus,
				JSON.stringify(queryStore.getQueryWithFacetting(query)),
			] as const,
			queryFn: async () => {
				yearlyFrequenciesLoading.value[index] = true;
				const response = await api.search.getFreqMl({
					corpname: query.corpus,
					usesubcorp: query.subCorpus,
					group: 0,
					showpoc: 1,
					showreltt: 1,
					showrel: 1,
					freqlevel: 1,
					ml1attr: "doc.year",
					ml1ctx: "0~0 > 0",
					json: JSON.stringify({ concordance_query: queryStore.getQueryWithFacetting(query) }),
				});
				return response.data;
			},
			select: (data: Type11Freqml) => {
				yearlyFrequencies.value[index] =
					data.Blocks?.map(
						(block) =>
							block.Items?.map((item) => {
								return {
									absolute: item.frq!,
									relative: item.reltt!,
									year: Number(item.Word?.reduce((acc, cur) => cur.n!, "")),
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

const sumInIntervals = function (numbers: Array<unknown>, intervalSize: number) {
	const results = [];
	const fullIntervals = Math.floor(numbers.length / intervalSize);

	for (let i = 0; i < fullIntervals; i++) {
		let sum = 0;
		let start, finish;
		for (let j = 0; j < intervalSize; j++) {
			if (j === 0) start = numbers[i * intervalSize + j][0];
			if (j === intervalSize - 1) finish = numbers[i * intervalSize + j][0];
			sum += numbers[i * intervalSize + j][1];
		}
		results.push([`${start}-${finish}`, sum]);
	}

	return results;
};

const series = computed(() => {
	const q = queries.value
		.filter((q, i) => yearlyFrequencies.value[i])
		.map((query, index) => ({
			name: `${query.type}: ${query.userInput} (${query.corpus}${
				query.subCorpus ? ` / ${query.subCorpus})` : ")"
			}`,
			data: (yearlyFrequencies.value[index] ?? [])
				.sort((a, b) => b.year - a.year)
				.map((point) => [point.year, mode.value === "relative" ? point.relative : point.absolute]),
			color: query.color,
		}));
	q.forEach((tq, i) => {
		//@ts-expect-error used only for chart rendering
		if (tq.data) q[i]!.data = sumInIntervals(tq.data.reverse(), interval.value);
	});
	return q;
});
</script>

<template>
	<VCard>
		<VCardItem :title="t('yearlyFrequencies')">
			<template #subtitle>
				{{ t("yearlyFrequenciesDesc") }}
			</template>
		</VCardItem>

		<VCardText class="py-0">
			<VBtnToggle v-model="mode" density="compact">
				<VBtn value="absolute" variant="outlined">{{ t("absolute") }}</VBtn>
				<VBtn value="relative" variant="outlined">{{ t("relative") }}</VBtn>
			</VBtnToggle>
			<VSelect
				v-model="interval"
				class="ml-4"
				item-title="description"
				item-value="value"
				:items="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
				label="Interval"
				style="flex-grow: 0"
			></VSelect>
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
			></HighCharts>
		</VCardText>

		<VExpandTransition v-if="expand">
			<DataDisplaySourceTable
				:data="yearlyFrequencies"
				datatype="yearlyFrequencies"
				:loading="yearlyFrequenciesLoading"
				:queries="queries"
			></DataDisplaySourceTable>
		</VExpandTransition>

		<VDivider></VDivider>

		<VCardActions>
			<VBtn size="small" variant="outlined" @click="expand = !expand">
				{{ !expand ? t("ShowData") : t("HideData") }}
			</VBtn>
		</VCardActions>
	</VCard>
</template>
