<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";

import type { Type11Freqml } from "~/lib/api-client";

const t = useTranslations("Corpsum");
const queryStore = useQueryStore();
const { queries } = storeToRefs(queryStore);

const mode = ref("relative");
const expand = ref(false);

const api = useApiClient();

const sourceDistributions: Ref<Array<Array<IsourceDistribution>>> = ref([]);
const sourceDistributionsLoading: Ref<Array<boolean>> = ref([]);

const q = computed(() =>
	queries.value.map((query, index) => {
		return {
			queryKey: [
				"get-source-distribution",
				query.corpus,
				query.subCorpus,
				JSON.stringify(queryStore.getQueryWithFacetting(query)),
			] as const,
			queryFn: async () => {
				sourceDistributionsLoading.value[index] = true;
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
					json: JSON.stringify({ concordance_query: queryStore.getQueryWithFacetting(query) }),
				});
				return response.data;
			},
			select: (data: Type11Freqml) => {
				sourceDistributions.value[index] =
					data.Blocks?.map(
						(block) =>
							block.Items?.map((item) => {
								return {
									absolute: item.frq!,
									relative: item.reltt!,
									media: item.Word![0]!.n!,
								};
							}) ?? [],
					)[0] ?? [];
				sourceDistributionsLoading.value[index] = false;
			},
		};
	}),
);

useQueries({ queries: q });

const chartMode: Ref<"seperate" | "stack"> = ref("stack");

const isStacked = computed(() => chartMode.value === "stack");
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
			<div class="flex items-center gap-2">
				<VBtnToggle v-model="chartMode" density="compact">
					<VBtn value="stack" variant="outlined">
						<VIcon icon="mdi-chart-bar-stacked" />
						<VTooltip activator="parent" location="top">stacked bar chart</VTooltip>
					</VBtn>
					<VBtn value="seperate" variant="outlined">
						<VIcon icon="mdi-poll" />
						<VTooltip activator="parent" location="top">seperated bar chart</VTooltip>
					</VBtn>
				</VBtnToggle>

				<VBtnToggle v-model="mode" density="compact">
					<VBtn value="absolute" variant="outlined">{{ t("absolute") }}</VBtn>
					<VBtn value="relative" variant="outlined">{{ t("relative") }}</VBtn>
				</VBtnToggle>
			</div>
			<div v-for="(query, index) of queries" :key="query.id">
				<div v-if="sourceDistributionsLoading[index]">
					<QueryDisplay :loading="sourceDistributionsLoading[index]" :query="query" />
				</div>
			</div>
			<!-- {{ series }} -->
			<!-- {{ chartMode }} -->

			<template v-if="sourceDistributions && queries">
				<MediaStackedBarChart
					:mode="mode as 'absolute' | 'relative'"
					:queries="queries"
					:source-distributions="sourceDistributions"
					:stack="isStacked"
				/>
			</template>
		</VCardText>

		<VExpandTransition v-if="expand">
			<DataDisplaySourceTable
				:data="sourceDistributions"
				datatype="mediaSources"
				:loading="sourceDistributionsLoading"
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
