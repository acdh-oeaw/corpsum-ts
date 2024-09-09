<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";

import type { Type10Collx } from "~/lib/api-client";

const t = useTranslations("Corpsum");
const queryStore = useQueryStore();
const { queries } = storeToRefs(queryStore);

const api = useApiClient();

type Mode = "coll_freq" | "freq";

const mode: Ref<Mode> = ref("coll_freq");

const expand = ref(false);
// const collocations: Ref<Array<Array<ICollocations>>> = ref([]);
interface CollocationEntry {
	word: string;
	freq: number;
	coll_freq: number;
	// todo: do this properly once it is known what is wanted
	d: number;
	m: number;
	t: number;
	name: string;
	weight: number;
	color: string;
}

const collocations: Ref<Array<Array<CollocationEntry>>> = ref([]);
const collocationsLoading: Ref<Array<boolean>> = ref([]);
// defines methods of data collocations
const cbgrfns = "dmt";
const q = computed(() =>
	queries.value.map((query, index) => {
		return {
			queryKey: [
				"get-yearly-frequencies",
				query.corpus,
				query.subCorpus,
				query.id,
				cbgrfns,
				"joooooo",
				JSON.stringify(queryStore.getQueryWithFacetting(query)),
			] as const,
			queryFn: async () => {
				collocationsLoading.value[index] = true;
				const response = await api.search.getCollx({
					corpname: query.corpus,
					usesubcorp: query.subCorpus,
					cattr: "lemma",
					ctow: 3,
					cminfreq: 9,
					cminbgr: 9,
					cbgrfns,
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
						const d = item.Stats?.find(({ n }) => n === "d");
						const m = item.Stats?.find(({ n }) => n === "m");
						const t = item.Stats?.find(({ n }) => n === "t");

						return {
							word: item.str!,
							freq: item.freq!,
							coll_freq: item.coll_freq!,
							d: d?.s ?? -1,
							m: m?.s ?? -1,
							t: t?.s ?? -1,
							// stats: item.Stats,

							// for highCharts
							name: item.str!,
							weight: item.coll_freq!,
							color: query.color,
						} as unknown as CollocationEntry;
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
	if (!(mode.value as unknown)) mode.value = "coll_freq";
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
		"D: " +
		// @ts-expect-error this is used inside the table rendering.
		this.d +
		"<br/>" +
		"M: " +
		// @ts-expect-error this is used inside the table rendering.
		this.m +
		"<br/>" +
		"T: " +
		// @ts-expect-error this is used inside the table rendering.
		this.t
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
			<VBtnToggle v-model="mode" density="compact">
				<VBtn value="coll_freq" variant="outlined">
					{{ t("coll_freq") }}
				</VBtn>
				<VBtn value="freq" variant="outlined">{{ t("freq") }}</VBtn>
			</VBtnToggle>

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
