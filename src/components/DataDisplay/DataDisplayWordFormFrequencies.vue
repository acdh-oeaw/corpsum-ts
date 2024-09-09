<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";

import type { Type11Freqml } from "~/lib/api-client";

const t = useTranslations("Corpsum");
const queryStore = useQueryStore();
const { queries } = storeToRefs(queryStore);

const api = useApiClient();

const wordFormFrequencies: Ref<Array<Array<{ word: string; absolute: number; relative: number }>>> =
	ref([]);
const wordFormFrequenciesLoading: Ref<Array<boolean>> = ref([]);

const q = computed(() =>
	queries.value.map((query, index) => {
		return {
			queryKey: [
				"get-wordform-frequencies",
				query.corpus,
				query.subCorpus,
				JSON.stringify(queryStore.getQueryWithFacetting(query)),
			] as const,
			queryFn: async () => {
				wordFormFrequenciesLoading.value[index] = true;
				const response = await api.search.getFreqMl({
					corpname: query.corpus,
					usesubcorp: query.subCorpus,
					ml1attr: "",
					ml1ctx: "",
					json: JSON.stringify({ concordance_query: queryStore.getQueryWithFacetting(query) }),
				});
				return response.data;
			},
			select: (data: Type11Freqml) => {
				wordFormFrequencies.value[index] =
					data.Blocks?.map(
						(block) =>
							block.Items?.map((item) => {
								return {
									word: item.Word![0]!.n!,
									absolute: item.frq!,
									relative: item.fpm!,
								};
							}) ?? [],
					)[0] ?? [];
				wordFormFrequenciesLoading.value[index] = false;
			},
		};
	}),
);

useQueries({ queries: q });

const mode = ref("relative");
const expand = ref(false);
</script>

<template>
	<VCard>
		<VCardItem :title="t('wordFormFrequencies')">
			<template #subtitle>
				<!-- <v-icon icon="mdi-alert" size="18" color="error" class="me-1 pb-1"></v-icon> -->
				{{ t("wordFormFrequenciesDesc") }}
			</template>
		</VCardItem>

		<VCardText class="py-0">
			<VBtnToggle v-model="mode" density="compact">
				<VBtn value="absolute" variant="outlined">{{ t("absolute") }}</VBtn>
				<VBtn value="relative" variant="outlined">{{ t("relative") }}</VBtn>
			</VBtnToggle>
			<div v-for="(query, index) of queries" :key="query.id">
				<QueryDisplay :loading="wordFormFrequenciesLoading[index]" :query="query" />
				<HighCharts
					:options="{
						chart: {
							type: 'bar',
						},
						title: {
							text: query.userInput,
						},
						xAxis: {
							categories: wordFormFrequencies[index]?.map(({ word }) => word),
						},

						yAxis: {
							title: {
								text: t('sources'),
							},
						},
						series: [
							{
								color: query.color,
								name: `${query.type}: ${query.userInput} (${query.corpus}${
									query.subCorpus ? ` / ${query.subCorpus})` : ')'
								}`,
								data: wordFormFrequencies[index]?.map(({ relative, absolute }) =>
									mode === 'relative' ? relative : absolute,
								),
							},
						],
					}"
				></HighCharts>
			</div>
		</VCardText>

		<VExpandTransition v-if="expand">
			<DataDisplaySourceTable
				:data="wordFormFrequencies"
				datatype="wordFormFrequencies"
				:loading="wordFormFrequenciesLoading"
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
