<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";

import { type Type11Freqml } from "~/lib/api-client";

const t = useTranslations("Corpsum");
const queryStore = useQueryStore();
const { queries } = storeToRefs(queryStore);

const api = useApiClient();

const regionalFrequencies: Ref<Array<Array<never>>> = ref([]);
const regionalFrequenciesLoading: Ref<Array<boolean>> = ref([]);

const chartMode: Ref<"seperate" | "combined"> = ref("combined");

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
				//@ts-expect-error TODO properly type this
				regionalFrequencies.value[index] =
					data.Blocks?.map(
						(block) =>
							block.Items?.map((item) => {
								return {
									region: item.Word![0]!.n,
									absolute: item.frq,
									relative: item.reltt,
								};
							}) ?? [],
					)[0] ?? [];
				regionalFrequenciesLoading.value[index] = false;
			},
		};
	}),
);
//@ts-expect-error TODO find out how to properly type this
useQueries({ queries: q });

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
			<div class="flex gap-2 items-center">
				<VBtnToggle v-model="chartMode" density="compact">
					<VBtn variant="outlined" value="combined">
						<VIcon icon="mdi-map" />
						<VIcon icon="mdi-chart-pie-outline" class="ml-[-0.3rem]" />

						<VTooltip location="top" activator="parent">combined map chart</VTooltip>
					</VBtn>
					<VBtn variant="outlined" value="seperate">
						<VIcon icon="mdi-map" class="z-30 bg-white" />
						<VIcon icon="mdi-map" class="z-20 ml-[-0.80rem] mt-[-0.5rem]" />
						<VTooltip location="top" activator="parent">seperated map charts</VTooltip>
					</VBtn>
				</VBtnToggle>
				<VBtnToggle v-model="mode" density="compact">
					<VBtn variant="outlined" value="absolute">{{ t("absolute") }}</VBtn>
					<VBtn variant="outlined" value="relative">{{ t("relative") }}</VBtn>
				</VBtnToggle>
			</div>
			<JsonViewer boxed :value="regionalFrequencies" :expand-depth="5"></JsonViewer>

			<div v-for="(query, index) of queries" :key="query.id">
				<div v-if="regionalFrequenciesLoading[index]">
					<VProgressCircular :color="query.color" indeterminate></VProgressCircular>
					<span :style="`color: ${query.color}`">
						{{ query.type }}: {{ query.userInput }}
						<CorpusChip :query="query" />
					</span>
				</div>
			</div>
			<div v-for="(query, index) of queries" :key="query.id">
				<div v-if="!regionalFrequenciesLoading[index]" class="mt-1">
					<span :style="`color: ${query.color}`">{{ query.type }}: {{ query.userInput }}</span>
					<CorpusChip :query="query" />
					<ClientOnly>
						<MapChart
							v-if="!isCombined"
							:query="query"
							:resdata="regionalFrequencies[index]!"
							:mode="mode"
						/>
					</ClientOnly>
				</div>
			</div>
			<div v-if="isCombined">
				<CombinedMapChart :queries="queries" :resdata="regionalFrequencies" :mode="mode" />
				<!-- <DemoChart /> -->
			</div>
		</VCardText>

		<VExpandTransition v-if="expand">
			<!-- @vue-expect-error TODO properly type this -->
			<DataDisplaySourceTable
				datatype="regionalFrequencies"
				:queries="queries"
				:loading="regionalFrequenciesLoading"
				:data="regionalFrequencies"
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
