<script lang="ts" setup>
import {useQueries} from "@tanstack/vue-query";
import { storeToRefs } from "pinia";

import  {type Type11Freqml} from "~/lib/api-client";

const t = useTranslations("Corpsum");
const queryStore = useQueryStore();
const { queries } = storeToRefs(queryStore);

const mode = ref("relative");
const expand = ref(false);

const api = useApiClient();

interface IsourceDistribution {
	media: string;
	absolute: number;
	relative: number;
}

const sourceDistributions: Ref<Array<Array<IsourceDistribution>>>  = ref([]);
const sourceDistributionsLoading: Ref<Array<boolean>> = ref([]);

const q = computed(() => queries.value.map((query, index) => {
	return {
		queryKey: ["get-source-distribution", query.corpus, query.subCorpus, query.finalQuery] as const,
		queryFn: async () => {
			sourceDistributionsLoading .value[index] = true;
			const response = await api.search.getFreqMl({
				corpname: query.corpus,
				usesubcorp: query.subCorpus,
				fmaxitems: 5000,
				fpage: 1,
				group: 0,
				showpoc: 1,
				showreltt: 1,
				showrel: 1,
				freqlevel: 1,
				ml1attr: "doc.docsrc",
				ml1ctx: "0~0 > 0",
				json: JSON.stringify({ concordance_query: query.concordance_query }),
			});
			return response.data;
		},
		select: (data: Type11Freqml) => {
			sourceDistributions.value[index] = data.Blocks?.map((block) => block.Items?.map(item => {
					return {
						absolute: item.frq!,
						relative: item.reltt!,
						media: item.Word![0]!.n!,
					};
				}) ?? []
			)[0] ?? [];
			sourceDistributionsLoading.value[index] = false;
		},
	};
}));


useQueries({	queries: q });

const categories = computed(() => {
	const allCats: Array<string> = [];
	queries.value.forEach((query: CorpusQuery, i) => {
		sourceDistributions.value[i]?.forEach((qm) => allCats.push(qm.media));
	});
	return [...new Set(allCats)];
});

const series = computed(() => {
	const allSeries = queries.value.map((query: CorpusQuery, i) => {
		return {
			color: query.color,
			name: `${query.type}: ${query.userInput} (${query.corpus}${
				query.subCorpus ? ` / ${query.subCorpus})` : ")"
			}`,
			data: categories.value
				.map((category) => sourceDistributions.value[i]?.find(({ media }) => category === media))
				// @ts-ignore
				.map((a) => (a ? a[mode.value] : 0)),
		};
	});
	return allSeries;
});
</script>

<template>
	<VCard>
		<VCardItem :title="t('mediaSources')">
			<template #subtitle>
				<!-- <v-icon icon="mdi-alert" size="18" color="error" class="me-1 pb-1"></v-icon> -->
				{{ t("mediaSourcesDesc") }}
			</template>
		</VCardItem>

		<VCardText>
			<VBtnToggle v-model="mode" density="compact">
				<VBtn variant="outlined" value="absolute">{{ t("absolute") }}</VBtn>
				<VBtn variant="outlined" value="relative">{{ t("relative") }}</VBtn>
			</VBtnToggle>
			<div v-for="(query, index) of queries" :key="query.id">
				<div v-if="sourceDistributionsLoading[index]">
					<VProgressCircular :color="query.color" indeterminate></VProgressCircular>
					<span :style="`color: ${query.color}`">{{ query.type }}: {{ query.userInput }}</span>
				</div>
			</div>
			<HighCharts
				style="height: 1200px"
				:options="{
					chart: {
						type: 'bar',
					},
					title: {
						text: `${series.length} ${t('queries')}`,
						align: 'center',
					},
					xAxis: {
						categories: categories,
					},

					yAxis: {
						title: {
							text: t('sources'),
						},
					},
					series,
				}"
			></HighCharts>
		</VCardText>

		<VExpandTransition v-if="expand">
			<DataDisplaySourceTable :queries="queries" datatype="mediaSources"></DataDisplaySourceTable>
		</VExpandTransition>

		<VDivider></VDivider>

		<VCardActions>
			<VBtn variant="outlined" size="small" @click="expand = !expand">
				{{ !expand ? t("ShowData") : t("HideData") }}
			</VBtn>
		</VCardActions>
	</VCard>
</template>
