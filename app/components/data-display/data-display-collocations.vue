<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";

import type { components } from "~/lib/noske-types";

type CollxResponse = components["schemas"]["10_collx"];

const t = useTranslations();
const queryStore = useQueryStore();
const { queries } = storeToRefs(queryStore);

const noskeId = computed(() => queries.value[0]?.noske ?? null);
const { client } = useNoskeClient(noskeId);

type Mode = "coll_freq" | "freq";

const mode: Ref<Mode> = ref("coll_freq");
const cattr: Ref<string> = ref("lemma");

const expand = ref(false);
interface CollocationEntry {
	word: string;
	freq: number;
	coll_freq: number;
	d: number;
	m: number;
	t: number;
	name: string;
	weight: number;
	color: string;
}

const collocations: Ref<Array<Array<CollocationEntry>>> = ref([]);
const collocationsLoading: Ref<Array<boolean>> = ref([]);
const cbgrfns = "dmt";
const q = computed(() =>
	queries.value.map((query, index) => {
		return {
			queryKey: [
				"get-yearly-frequencies",
				noskeId.value,
				query.corpus,
				query.subCorpus,
				query.id,
				cattr.value,
				cbgrfns,
				JSON.stringify(queryStore.getQueryWithFacetting(query)),
			] as const,
			enabled: Boolean(client.value),
			queryFn: async () => {
				const activeClient = client.value;
				if (!activeClient) throw new Error("NoSketch client is not ready yet.");
				collocationsLoading.value[index] = true;
				const { data, error } = await activeClient.GET("/search/collx", {
					params: {
						query: {
							corpname: query.corpus,
							usesubcorp: query.subCorpus || undefined,
							cattr: cattr.value,
							ctow: 3,
							cminfreq: 9,
							cminbgr: 9,
							cbgrfns,
							csortfn: "d",
							citemsperpage: 10,
							// @ts-expect-error openapi json parameter mismatch
							json: JSON.stringify({ concordance_query: queryStore.getQueryWithFacetting(query) }),
						},
					},
				});
				if (error) throw error;
				return data;
			},
			select: (data: CollxResponse) => {
				collocations.value[index] =
					data.Items?.map((item) => {
						const d = item.Stats?.find(({ n }) => n === "d");
						const m = item.Stats?.find(({ n }) => n === "m");
						const tStat = item.Stats?.find(({ n }) => n === "t");
						return {
							word: item.str!,
							freq: item.freq!,
							coll_freq: item.coll_freq!,
							d: d?.s ? Number(d.s) : -1,
							m: m?.s ? Number(m.s) : -1,
							t: tStat?.s ? Number(tStat.s) : -1,
							name: item.str!,
							weight: item.coll_freq!,
							color: query.color,
						} as CollocationEntry;
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
				data: collocation.map((entry: CollocationEntry) => ({
					...entry,
					weight: entry[mode.value],
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
		`<b>${
			// @ts-expect-error highcharts internal
			this.name
		}</b><br/>` +
		`Frequency: ${
			// @ts-expect-error highcharts internal
			this.freq
		}<br/>` +
		`Collocational Frequency: ${
			// @ts-expect-error highcharts internal
			this.coll_freq
		}<br/>` +
		`D: ${
			// @ts-expect-error highcharts internal
			this.d
		}<br/>` +
		`M: ${
			// @ts-expect-error highcharts internal
			this.m
		}<br/>` +
		`T: ${
			// @ts-expect-error highcharts internal
			this.t
		}`
	);
}
</script>

<template>
	<Card>
		<CardHeader>
			<CardTitle>{{ t("collocations") }}</CardTitle>
			<CardDescription>{{ t("yearlyFrequenciesDesc") }}</CardDescription>
		</CardHeader>

		<CardContent class="space-y-4">
			<div class="flex flex-wrap items-center gap-3">
				<ToggleGroup v-model="mode" class="flex" type="single">
					<ToggleGroupItem value="coll_freq">{{ t("coll_freq") }}</ToggleGroupItem>
					<ToggleGroupItem value="freq">{{ t("freq") }}</ToggleGroupItem>
				</ToggleGroup>
				<div class="space-y-1">
					<Label for="collocations-cattr">{{ t("cattr") }}</Label>
					<Select v-model="cattr" :aria-label="t('cattr')">
						<SelectTrigger id="collocations-cattr" class="min-w-60">
							<SelectValue :placeholder="t('cattr')" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="lemma">lemma</SelectItem>
							<SelectItem value="word">word</SelectItem>
							<SelectItem value="lempos">lempos</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			<div v-for="(query, index) of queries" :key="query.id">
				<QueryDisplay :loading="collocationsLoading[index]" :query="query" />
				<WordCloudGraph
					v-if="!collocationsLoading[index]"
					:color="query.color"
					:query-label="query.userInput"
					:title="`${t(mode)} for ${query.userInput}`"
					:words="series[index]?.[0]?.data ?? []"
				/>
			</div>
		</CardContent>

		<Collapsible v-model:open="expand">
			<CollapsibleContent class="px-6 pb-6">
				<DataDisplaySourceTable
					v-if="!loading"
					:data="sortedCollocations"
					datatype="collocations"
					:loading="collocationsLoading"
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
