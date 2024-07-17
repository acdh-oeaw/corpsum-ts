<script lang="ts" setup>
import { storeToRefs } from "pinia";
import Swal from "sweetalert2";
import type { Ref } from "vue";

import {useCreateSubcorpus} from "@/composables/useCreateSubcorpus.ts";

import CorpusChip from "../Search/CorpusChip.vue";
import KWICDetailDialog from "./KWICDetailDialog.vue";
import type {Type06Concordance, Type11Freqml} from "~/lib/api-client";
import {useQueries} from "@tanstack/vue-query";

const t = useTranslations("Corpsum");
const queryStore = useQueryStore();
const corporaStore = useCorporaStore();

const { queries } = storeToRefs(queryStore);
const { selectedCorpus } = storeToRefs(corporaStore);

const headers = ref([
	{ title: t("date"), key: "date", type: "string" },
	{ title: t("source"), key: "source", type: "string" },
	{ title: t("region"), key: "region", type: "string" },
	{ title: t("left"), key: "left", type: "string" },
	{ title: t("word"), key: "word", type: "string" },
	{ title: t("right"), key: "right", type: "string" },
	{ title: t("docid"), key: "docid", type: "string" },
	{ title: t("topic"), key: "topic", type: "string" },
	{ title: t("toknum"), key: "toknum", type: "string" },
	{ title: t("link"), key: "open", type: "string" },
]);

const api = useApiClient();

const KWICresults: Ref<Array<Array<never>>> = ref([]);
const KWICresultsLoading: Ref<Array<boolean>> = ref([]);

const q = computed(() => queries.value.map((query, index) => {
	return {
		queryKey: ["get-concordance", query.corpus, query.subCorpus, query.finalQuery] as const,
		queryFn: async () => {
			KWICresultsLoading.value[index] = true;
			const response = await api.search.getConcordance({
				corpname: query.corpus,
				usesubcorp: query.subCorpus,
				viewmode: "kwic",
				attrs: "word",
				refs: "=doc.id,=doc.datum,=doc.region,=doc.ressort2,=doc.docsrc_name",
				pagesize: 1000,
				json: JSON.stringify({ concordance_query: query.concordance_query }),
				format: "json"
			});
			return response.data;
		},
		select: (data: Type06Concordance) => {
			KWICresults.value[index] = data.Lines?.map(	({ Tbl_refs, Left, Kwic, toknum, Right }) => {
				// this mapping is directly taken from the ancient code
				return {
					refs: Tbl_refs,
					date: Tbl_refs![1] ?? "",
					source: Tbl_refs![4] ?? "",
					region: Tbl_refs![2] ?? "",
					left: Left!.map(({ str }: { str: string }) => str).join(" "),
					word: typeof Kwic![0] !== "undefined" ? Kwic![0].str : "",
					right: Right!.map(({ str }: { str: string }) => str).join(" "),
					docid: Tbl_refs![0] ?? "",
					topic: Tbl_refs![3] ?? "",
					toknum,
				};
				}) ?? [];
			KWICresultsLoading.value[index] = false;
		},
	};
}));


useQueries({	queries: q });

function open(item: KeywordInContext) {
	selectedKWIC.value = item;
}

const selectedKWIC: Ref<KeywordInContext | null> = ref(null);
</script>

<template>
	<VCard>
		<VCardItem :title="t('keywordInContext')">
			<template #subtitle>
				{{ t("keywordInContextDesc") }}
			</template>
		</VCardItem>
		<VCardText class="py-0">
			<div v-for="(query, index) of queries" :key="query.id">
				<div v-if="!KWICresultsLoading[index]">
					<span :style="`color: ${query.color}`">
						{{ query.type }}: {{ query.userInput }}
						<CorpusChip :query="query" />
					</span>
					<VDataTable
						density="compact"
						:headers="headers"
						item-value="docid"
						:items="KWICresults[index] as KeywordInContext[]"
						dense
					>
						<template #[`item.open`]="{ item }">
							<VIcon size="small" class="me-2" icon="mdi-open-in-new" @click="open(item)" />
						</template>
					</VDataTable>
					<KWICDetailDialog :query="query" :kwic="selectedKWIC" @close="selectedKWIC = null" />
				</div>
				<VProgressCircular v-else :color="query.color" indeterminate></VProgressCircular>
			</div>
		</VCardText>

		<VDivider></VDivider>
	</VCard>
</template>
