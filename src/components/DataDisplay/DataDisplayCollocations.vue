<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";

import type { Type10Collx } from "~/lib/api-client";

const t = useTranslations("Corpsum");
const queryStore = useQueryStore();
const { queries } = storeToRefs(queryStore);

const api = useApiClient();

type Mode = "logDice" | "freq";

const mode: Ref<Mode> = ref("logDice");
const cattr: Ref<string> = ref("lemma");

const expand = ref(false);
interface CollocationEntry {
	word: string;
	freq: number;
	coll_freq: number;
	logDice: number;
	name: string;
	weight: number;
	color: string;
}

const collocations: Ref<Array<Array<CollocationEntry>>> = ref([]);
const collocationsLoading: Ref<Array<boolean>> = ref([]);
const associationMeasure = "d";
const contextWindow = { from: -5, to: 5 } as const;
const q = computed(() =>
	queries.value.map((query, index) => {
		return {
			queryKey: [
				"get-yearly-frequencies",
				query.corpus,
				query.subCorpus,
				query.id,
				cattr.value,
				associationMeasure,
				contextWindow.from,
				contextWindow.to,
				"joooooo",
				JSON.stringify(queryStore.getQueryWithFacetting(query)),
			] as const,
			queryFn: async () => {
				collocationsLoading.value[index] = true;
				const response = await api.search.getCollx({
					corpname: query.corpus,
					usesubcorp: query.subCorpus,
					cattr: cattr.value,
					cfromw: contextWindow.from,
					ctow: contextWindow.to,
					cminfreq: 9,
					cminbgr: 9,
					cbgrfns: associationMeasure,
					csortfn: "d",
					citemsperpage: 10,
					// @ts-expect-error descrtiption wrong
					json: JSON.stringify({ concordance_query: queryStore.getQueryWithFacetting(query) }),
				});
				return response.data;
			},
			select: (data: Type10Collx) => {
				collocations.value[index] =
					data.Items?.map((item) => {
						const logDice = Number(item.Stats?.find(({ n }) => n === "d")?.s ?? -1);

						return {
							word: item.str!,
							freq: item.freq!,
							coll_freq: item.coll_freq!,
							logDice,

							// for highCharts
							name: item.str!,
							weight: logDice,
							color: query.color,
						};
					}) ?? [];
				collocationsLoading.value[index] = false;
			},
		};
	}),
);

const sortedCollocations = computed(() =>
	collocations.value.map((collocation) =>
		collocation.sort((a, b) => b[mode.value] - a[mode.value]),
	),
);

const loading = ref(false);

watch(mode, () => {
	if (!(mode.value as unknown)) mode.value = "logDice";
	loading.value = true;
	setTimeout(() => {
		loading.value = false;
	}, 10);
});

const series = computed(() =>
	collocations.value.map((collocation, index) => {
		if (collocationsLoading.value[index]) return [];
		return [
			{
				type: "wordcloud",
				data: collocation.map((a: CollocationEntry) => ({
					...a,
					weight: a[mode.value],
				})),
				name: t(mode.value),
				rotation: {
					from: 0,
					to: 0,
				},
				color: (point: { color: string }) => point.color,
				tooltip: {
					pointFormatter,
				},
			},
		];
	}),
);

useQueries({ queries: q });

function pointFormatter() {
	return (
		"<b>" +
		// @ts-expect-error this is used inside the table rendering. -> todo: find out how to type this
		this.name +
		"</b><br/>" +
		"Frequency: " +
		// @ts-expect-error this is used inside the table rendering.
		this.freq +
		"<br/>" +
		"Collocational Frequency: " +
		// @ts-expect-error this is used inside the table rendering.
		this.coll_freq +
		"<br/>" +
		"logDice: " +
		// @ts-expect-error this is used inside the table rendering.
		this.logDice
	);
}
</script>

<template>
	<VCard>
		<VCardItem :title="t('collocations')">
			<template #subtitle>
				{{ t("yearlyFrequenciesDesc") }}
			</template>
		</VCardItem>

		<VCardText class="py-0">
			<VBtnToggle v-model="mode" density="compact" mandatory>
				<VBtn value="logDice" variant="outlined">
					{{ t("coll_freq") }}
				</VBtn>
				<VBtn value="freq" variant="outlined">{{ t("freq") }}</VBtn>
			</VBtnToggle>
			<VSelect
				v-model="cattr"
				item-title="cattr"
				:items="['lemma', 'word', 'lempos']"
				:label="t('cattr')"
				style="flex-grow: 0; min-width: 15rem"
			></VSelect>
			<div v-for="(query, index) of queries" :key="query.id">
				<QueryDisplay :loading="collocationsLoading[index]" :query="query" />
				<HighCharts
					v-if="!collocationsLoading[index]"
					:options="{
						series: series[index],
						title: {
							text: `${t(mode)} for ${query.userInput}`,
							align: 'center',
						},
					}"
				></HighCharts>
			</div>
		</VCardText>

		<VExpandTransition v-if="expand">
			<DataDisplaySourceTable
				v-if="!loading"
				:data="sortedCollocations"
				datatype="collocations"
				:loading="collocationsLoading"
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
