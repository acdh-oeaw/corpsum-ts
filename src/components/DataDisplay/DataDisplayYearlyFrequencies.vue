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
				query.finalQuery,
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
					json: JSON.stringify({ concordance_query: query.concordance_query }),
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
				yearlyFrequenciesLoading.value[index] = false;
			},
		};
	}),
);

useQueries({ queries: q });

const series = computed(() =>
	queries.value
		.filter((q, i) => yearlyFrequencies.value[i])
		.map((query, index) => ({
			name: `${query.type}: ${query.userInput} (${query.corpus}${
				query.subCorpus ? ` / ${query.subCorpus})` : ")"
			}`,
			data: yearlyFrequencies.value[index]!.sort((a, b) => b.year - a.year).map((point) => [
				point.year,
				mode.value === "relative" ? point.relative : point.absolute,
			]),
			color: query.color,
		})),
);
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
				<VBtn variant="outlined" value="absolute">{{ t("absolute") }}</VBtn>
				<VBtn variant="outlined" value="relative">{{ t("relative") }}</VBtn>
			</VBtnToggle>
			<div v-for="(query, index) of queries" :key="query.id">
				<div v-if="yearlyFrequenciesLoading[index]">
					<VProgressCircular :color="query.color" indeterminate></VProgressCircular>
					<span :style="`color: ${query.color}`">{{ query.type }}: {{ query.userInput }}</span>
				</div>
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
				:queries="queries"
				:data="yearlyFrequencies"
				:loading="yearlyFrequenciesLoading"
				datatype="yearlyFrequencies"
			></DataDisplaySourceTable>
		</VExpandTransition>

		<VDivider></VDivider>

		<VCardActions>
			<VBtn variant="outlined" size="small" @click="expand = !expand">
				{{ !expand ? t("ShowData") : t("HideData") }}
			</VBtn>
		</VCardActions>
	</VCard>
</template>
