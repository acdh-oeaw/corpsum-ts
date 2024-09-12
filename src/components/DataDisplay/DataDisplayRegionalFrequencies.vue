<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";

import type { Type11Freqml } from "~/lib/api-client";

const t = useTranslations("Corpsum");
const queryStore = useQueryStore();
const { queries } = storeToRefs(queryStore);

const api = useApiClient();

const regionalFrequencies: Ref<Array<RegionalFrequency>> = ref([]);
const regionalFrequenciesLoading: Ref<Array<boolean>> = ref([]);

const chartMode: Ref<"combined" | "seperate"> = ref("combined");

const isCombined = computed(() => chartMode.value === "combined");

const q = computed(() =>
	queries.value.map((query, index) => {
		return {
			queryKey: [
				"get-regional-frequencies",
				query.corpus,
				query.subCorpus,
				JSON.stringify(queryStore.getQueryWithFacetting(query)),
			] as const,
			queryFn: async () => {
				regionalFrequenciesLoading.value[index] = true;
				const response = await api.search.getFreqMl({
					corpname: query.corpus,
					usesubcorp: query.subCorpus,
					group: 0,
					showpoc: 1,
					showreltt: 1,
					showrel: 1,
					freqlevel: 1,
					ml1attr: "doc.region",
					ml1ctx: "0~0 > 0",
					json: JSON.stringify({ concordance_query: queryStore.getQueryWithFacetting(query) }),
				});
				return response.data;
			},
			select: (data: Type11Freqml) => {
				regionalFrequencies.value[index] = {
					query: query.id,
					data:
						data.Blocks?.map(
							(block) =>
								block.Items?.map((item) => {
									return {
										region: item.Word![0]!.n!,
										absolute: item.frq!,
										relative: item.reltt!,
									};
								}) ?? [],
						)[0] ?? [],
				};
				regionalFrequenciesLoading.value[index] = false;
			},
		};
	}),
);

useQueries({ queries: q });

const loading = computed(() => {
	return regionalFrequenciesLoading.value.reduce((a, b) => a || b, false);
});

const mode: Ref<"relative" | "absolute"> = ref("relative");

watch(mode, (value?: string) => {
	if (!value) mode.value = "relative";
});

// sadly this is needed to redraw the combined chart. also kills the data that is from a removed query
watch(queries.value, () => {
	// console.log("queries chagened", queries.value);
	const queryIds = queries.value.map(({ id }) => id);
	regionalFrequencies.value = regionalFrequencies.value.filter(({ query }) =>
		queryIds.includes(query),
	);
	// sometimes there end up duplicates in the regionalFrequencies. prop due to the useQueries, if a query is being deleted
	regionalFrequencies.value = regionalFrequencies.value.filter(
		(a, idx) => regionalFrequencies.value.findIndex((b) => b.query === a.query) === idx,
	);
});

const expand = ref(false);
</script>

<template>
	<VCard>
		<VCardItem :title="t('regionalFrequencies')">
			<template #subtitle>
				<!-- <v-icon icon="mdi-alert" size="18" color="error" class="me-1 pb-1"></v-icon> -->
				{{ t("regionalFrequenciesDesc") }}
			</template>
		</VCardItem>

		<VCardText class="py-0">
			<div class="flex items-center gap-2">
				<VBtnToggle v-model="chartMode" density="compact">
					<VBtn value="combined" variant="outlined">
						<VIcon icon="mdi-map" />
						<VIcon class="ml-[-0.3rem]" icon="mdi-chart-pie-outline" />

						<VTooltip activator="parent" location="top">combined map chart</VTooltip>
					</VBtn>
					<VBtn value="seperate" variant="outlined">
						<VIcon class="z-30 bg-white" icon="mdi-map" />
						<VIcon class="z-20 -mt-2 ml-[-0.80rem]" icon="mdi-map" />
						<VTooltip activator="parent" location="top">seperated map charts</VTooltip>
					</VBtn>
				</VBtnToggle>
				<VBtnToggle v-model="mode" density="compact">
					<VBtn value="absolute" variant="outlined">{{ t("absolute") }}</VBtn>
					<VBtn value="relative" variant="outlined">{{ t("relative") }}</VBtn>
				</VBtnToggle>
			</div>
			<!-- <JsonViewer boxed :value="regionalFrequencies" :expand-depth="5"></JsonViewer> -->

			<div v-for="(query, index) of queries" :key="query.id">
				<div class="mt-1">
					<QueryDisplay :loading="regionalFrequenciesLoading[index]" :query="query" />
					<ClientOnly v-if="!regionalFrequenciesLoading[index] && regionalFrequencies[index]">
						<MapChart
							v-if="!isCombined"
							:mode="mode"
							:query="query"
							:resdata="regionalFrequencies[index].data"
						/>
					</ClientOnly>
				</div>
			</div>
			<div v-if="isCombined && !loading && queries.length > 0">
				<CombinedMapChart :mode="mode" :queries="queries" :resdata="regionalFrequencies" />
				<!-- <DemoChart /> -->
			</div>
		</VCardText>

		<VExpandTransition v-if="expand">
			<DataDisplaySourceTable
				:data="regionalFrequencies.map((a) => a.data)"
				datatype="regionalFrequencies"
				:loading="regionalFrequenciesLoading"
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
