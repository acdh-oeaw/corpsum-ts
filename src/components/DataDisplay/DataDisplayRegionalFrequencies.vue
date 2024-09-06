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

const mode = ref("relative");
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
					<VBtn variant="outlined" value="combined">
						<VIcon icon="mdi-map" />
						<VIcon icon="mdi-chart-pie-outline" class="ml-[-0.3rem]" />

						<VTooltip location="top" activator="parent">combined map chart</VTooltip>
					</VBtn>
					<VBtn variant="outlined" value="seperate">
						<VIcon icon="mdi-map" class="z-30 bg-white" />
						<VIcon icon="mdi-map" class="z-20 -mt-2 ml-[-0.80rem]" />
						<VTooltip location="top" activator="parent">seperated map charts</VTooltip>
					</VBtn>
				</VBtnToggle>
				<VBtnToggle v-model="mode" density="compact">
					<VBtn variant="outlined" value="absolute">{{ t("absolute") }}</VBtn>
					<VBtn variant="outlined" value="relative">{{ t("relative") }}</VBtn>
				</VBtnToggle>
			</div>
			<!-- <JsonViewer boxed :value="regionalFrequencies" :expand-depth="5"></JsonViewer> -->

			<div v-for="(query, index) of queries" :key="query.id">
				<div class="mt-1">
					<QueryDisplay :query="query" :loading="regionalFrequenciesLoading[index]" />
					<ClientOnly v-if="!regionalFrequenciesLoading[index] && regionalFrequencies[index]">
						<MapChart
							v-if="!isCombined"
							:query="query"
							:resdata="regionalFrequencies[index].data"
							:mode="mode"
						/>
					</ClientOnly>
				</div>
			</div>
			<div v-if="isCombined && !loading && queries.length > 0">
				<CombinedMapChart :queries="queries" :resdata="regionalFrequencies" :mode="mode" />
				<!-- <DemoChart /> -->
			</div>
		</VCardText>

		<VExpandTransition v-if="expand">
			<DataDisplaySourceTable
				datatype="regionalFrequencies"
				:queries="queries"
				:loading="regionalFrequenciesLoading"
				:data="regionalFrequencies.map((a) => a.data)"
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
