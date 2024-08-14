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
const collocations: Ref<Array<Array<never>>> = ref([]);
const collocationsLoading: Ref<Array<boolean>> = ref([]);

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
					json: JSON.stringify({ concordance_query: queryStore.getQueryWithFacetting(query) }),
				});
				return response.data;
			},
			select: (data: Type10Collx) => {
				collocations.value[index] = data.Items?.map((item) => {
					const d = item.Stats?.find(({ n }) => n === "d");
					const m = item.Stats?.find(({ n }) => n === "m");
					const t = item.Stats?.find(({ n }) => n === "t");

					return {
						word: item.str,
						freq: item.freq,
						coll_freq: item.coll_freq,
						// todo: do this properly:
						d: d?.s ?? -1,
						m: m?.s ?? -1,
						t: t?.s ?? -1,
						// stats: item.Stats,

						// for highCharts
						name: item.str,
						weight: item.coll_freq,
						color: query.color,
					};
				});
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

watch(queries.value, () => {
	// console.log("queries chagened", queries.value);
	const queryIds = queries.value.map(({ id }) => id);
	collocations.value = collocations.value.filter(({ query }) => queryIds.includes(query));
	// sometimes there end up duplicates in the regionalFrequencies. prop due to the useQueries, if a query is being deleted
	collocations.value = collocations.value.filter(
		(a, idx) => collocations.value.findIndex((b) => b.query === a.query) === idx,
	);
});

const series = computed(() =>
	collocations.value.map((collocation, index) => {
		if (collocationsLoading.value[index]) return [];
		return [
			{
				type: "wordcloud",
				data: collocation.map((a) => ({
					...a,
					weight: a[mode.value],
				})),
				name: t(mode.value),
				rotation: {
					from: 0,
					to: 0,
				},
				color: (point) => point.color,
				tooltip: {
					pointFormatter,
				},
			},
		];
	}),
);

//@ts-expect-error TODO find out how to properly type this
useQueries({ queries: q });

function pointFormatter() {
	return (
		"<b>" +
		this.name +
		"</b><br/>" +
		"Frequency: " +
		this.freq +
		"<br/>" +
		"Collocational Frequency: " +
		this.coll_freq +
		"<br/>" +
		"D: " +
		this.d +
		"<br/>" +
		"M: " +
		this.m +
		"<br/>" +
		"T: " +
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
				<VBtn variant="outlined" value="coll_freq">
					{{ t("coll_freq") }}
				</VBtn>
				<VBtn variant="outlined" value="freq">{{ t("freq") }}</VBtn>
			</VBtnToggle>

			<div v-for="(query, index) of queries" :key="query.id">
				<QueryDisplay :query="query" :loading="collocationsLoading[index]" />
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
			<!-- @vue-expect-error TODO properly type this -->
			<DataDisplaySourceTable
				v-if="!loading"
				:queries="queries"
				:data="sortedCollocations"
				:loading="collocationsLoading"
				datatype="collocations"
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
