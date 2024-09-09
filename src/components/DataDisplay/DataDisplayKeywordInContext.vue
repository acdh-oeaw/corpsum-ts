<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";
import type { Ref } from "vue";

import { getKWICColumns } from "@/utils/kwic";
import type { Type06Concordance } from "~/lib/api-client";

import KWICDetailDialog from "./KWICDetailDialog.vue";

const t = useTranslations("Corpsum");
const queryStore = useQueryStore();

const { queries } = storeToRefs(queryStore);

const api = useApiClient();

const showViewOptionsMode = ref(false);
const KWICresults: Ref<Array<Array<KeywordInContext>>> = ref([]);
const KWICresultsLoading: Ref<Array<boolean>> = ref([]);

const q = computed(() =>
	queries.value.map((query, index) => {
		return {
			queryKey: [
				"get-concordance",
				query.corpus,
				query.subCorpus,
				JSON.stringify(queryStore.getKWICqueryAttrStrcs(query)),
				JSON.stringify(queryStore.getQueryWithFacetting(query)),
			] as const,
			queryFn: async () => {
				KWICresultsLoading.value[index] = true;
				const response = await api.search.getConcordance({
					corpname: query.corpus,
					usesubcorp: query.subCorpus,
					viewmode: "kwic",
					...queryStore.getKWICqueryAttrStrcs(query),
					refs: "=doc.id,=doc.datum,=doc.region,=doc.ressort2,=doc.docsrc_name",
					pagesize: 1000,
					json: JSON.stringify({ concordance_query: queryStore.getQueryWithFacetting(query) }),
					format: "json",
				});
				return response.data;
			},
			select: (data: Type06Concordance) => {
				KWICresults.value[index] = (data.Lines?.map(({ Tbl_refs, Left, Kwic, toknum, Right }) => {
					// this mapping is directly taken from the ancient code
					return {
						refs: Tbl_refs,
						date: Tbl_refs![1] ?? "",
						source: Tbl_refs![4] ?? "",
						region: Tbl_refs![2] ?? "",
						// @ts-expect-error wrong types in api lib
						left: Left!.map(({ str, strc }) => str || strc).join(" "),
						word: typeof Kwic![0] !== "undefined" ? Kwic![0].str : "",
						right: Right!.map(({ str }: { str: string }) => str).join(" "),
						docid: Tbl_refs![0] ?? "",
						topic: Tbl_refs![3] ?? "",
						toknum,
					};
				}) ?? []) as unknown as Array<KeywordInContext>;
				KWICresultsLoading.value[index] = false;
			},
		};
	}),
);

useQueries({ queries: q });

function open(item: KeywordInContext) {
	selectedKWIC.value = item;
}

const selectedKWIC: Ref<KeywordInContext | null> = ref(null);

const columns = getKWICColumns(t as unknown as (s: string) => string, open);
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
				<VCheckbox v-model="showViewOptionsMode" :label="t('viewOptions')"></VCheckbox>
				<KWICAttributeSelect v-if="showViewOptionsMode" :query="query" />
				<div>
					<QueryDisplay :loading="KWICresultsLoading[index]" :query="query" />

					<CorpsumDataTable
						v-if="!KWICresultsLoading[index]"
						:columns="columns"
						:data="KWICresults[index]!"
					/>

					<KWICDetailDialog
						v-if="selectedKWIC"
						:kwic="selectedKWIC"
						:query="query"
						@close="selectedKWIC = null"
					/>
				</div>
			</div>
		</VCardText>
	</VCard>
</template>
