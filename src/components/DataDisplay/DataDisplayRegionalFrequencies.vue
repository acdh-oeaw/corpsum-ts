<script lang="ts" setup>
import { storeToRefs } from "pinia";
import type {Type11Freqml} from "~/lib/api-client";
import {useQueries} from "@tanstack/vue-query";

const t = useTranslations("Corpsum");
const queryStore = useQueryStore();
const { queries } = storeToRefs(queryStore);

const api = useApiClient();

const regionalFrequencies: Ref<Array<Array<never>>> = ref([]);
const regionalFrequenciesLoading: Ref<Array<boolean>> = ref([]);

const q = computed(() => queries.value.map((query, index) => {
	return {
		queryKey: ["get-regional-frequencies", query.corpus, query.subCorpus, query.finalQuery] as const,
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
				json: JSON.stringify({ concordance_query: query.concordance_query }),
			});
			return response.data;
		},
		select: (data: Type11Freqml) => {
			regionalFrequencies.value[index] = data.Blocks?.map((block) => block.Items?.map(item => {
					return {
						region: item.Word![0]!.n,
						absolute: item.frq,
						relative: item.reltt,
					};
				}) ?? []
			)[0] ?? [];
			regionalFrequenciesLoading.value[index] = false;
		},
	};
}));


useQueries({	queries: q });

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
			<VBtnToggle v-model="mode" density="compact">
				<VBtn variant="outlined" value="absolute">{{ t("absolute") }}</VBtn>
				<VBtn variant="outlined" value="relative">{{ t("relative") }}</VBtn>
			</VBtnToggle>
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
						<MapChart :query="query" :resdata="regionalFrequencies[index]!" :mode="mode" />
					</ClientOnly>
				</div>
			</div>
		</VCardText>

		<VExpandTransition v-if="expand">
			<DataDisplaySourceTable
				:queries="regionalFrequencies"
				datatype="regionalFrequencies"
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
