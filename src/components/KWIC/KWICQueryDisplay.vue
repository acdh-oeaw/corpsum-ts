<script lang="ts" setup>
import { useQuery } from "@tanstack/vue-query";

import { getKWICColumns } from "@/utils/kwic";
import type { Type06Concordance } from "~/lib/api-client";

const props = defineProps<{ query: CorpusQuery }>();
const showViewOptionsMode = ref(false);

const queryStore = useQueryStore();

const api = useApiClient();

const { data: KWICresults, status } = useQuery({
	queryKey: [
		"get-concordance",
		props.query.corpus,
		props.query.subCorpus,
		props.query.KWICAttrsStructs,
		queryStore.getQueryWithFacetting(props.query),
	],
	queryFn: async () => {
		const response = await api.search.getConcordance({
			corpname: props.query.corpus,
			usesubcorp: props.query.subCorpus,
			viewmode: "kwic",
			...queryStore.getKWICqueryAttrStrcs(props.query),
			refs: props.query.KWICAttrsStructs.structures.map((s: string) => `=${s}`).join(","),
			pagesize: 1000,
			json: JSON.stringify({ concordance_query: queryStore.getQueryWithFacetting(props.query) }),
			format: "json",
		});
		return response.data;
	},
	select: (data: Type06Concordance) => {
		return (data.Lines?.map(({ Tbl_refs, Left, Kwic, toknum, Right }) => {
			// this mapping is directly taken from the ancient code
			return {
				refs: Tbl_refs,
				date: Tbl_refs![1] ?? "",
				source: Tbl_refs![3] ?? "",
				region: Tbl_refs![2] ?? "",
				// @ts-expect-error wrong types in api lib
				left: Left!.map(({ str, strc }) => str || strc).join(" "),
				word: typeof Kwic![0] !== "undefined" ? Kwic![0].str : "",
				// @ts-expect-error wrong types in api lib
				right: Right!.map(({ str }: { str: string }) => str).join(" "),
				docid: Tbl_refs![0] ?? "",
				toknum,
			};
		}) ?? []) as unknown as Array<KeywordInContext>;
	},
});

const loading = computed(() => status.value === "pending");

function open(item: KeywordInContext) {
	selectedKWIC.value = item;
}

const t = useTranslations("Corpsum");

const translateWithoutNamespace = useTranslations();

const columns = computed(() => {
	return getKWICColumns(
		translateWithoutNamespace as unknown as (s: string) => string,
		open,
		props.query.KWICAttrsStructs.structures,
		queryStore.fixedKWICStructures,
	);
});

const selectedKWIC: Ref<KeywordInContext | null> = ref(null);
</script>

<template>
	<div v-if="query">
		<VCheckbox v-model="showViewOptionsMode" :label="t('viewOptions')"></VCheckbox>
		<KWICAttributeSelect v-if="showViewOptionsMode" :query="query" />
		<div>
			<QueryDisplay :loading="loading" :query="query" />
			<CorpsumDataTable v-if="!loading" :columns="columns" :data="KWICresults!" />
			<KWICDetailDialog
				v-if="selectedKWIC"
				:kwic="selectedKWIC"
				:query="query"
				@close="selectedKWIC = null"
			/>
		</div>
	</div>
</template>
