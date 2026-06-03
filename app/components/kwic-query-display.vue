<script lang="ts" setup>
import { getKWICColumns } from "@/utils/kwic";
import type { components } from "~/lib/noske-types";

type ConcordanceResponse = components["schemas"]["06_concordance"];

const props = defineProps<{ query: CorpusQuery }>();
const showViewOptionsMode = ref(false);

const queryStore = useQueryStore();

const noskeId = computed(() => props.query.noske ?? null);
const { useNoskeQuery } = useNoskeClient(noskeId);

const facettingQuery = computed(() => queryStore.getQueryWithFacetting(props.query));

const kwicQueryKey = computed(() => [
	"get-concordance",
	props.query.corpus,
	props.query.subCorpus,
	props.query.KWICAttrsStructs,
	facettingQuery.value,
]);

const kwicQuery = useNoskeQuery<ConcordanceResponse>({
	queryKey: kwicQueryKey,
	async queryFn(client) {
		const { data, error } = await client.GET("/search/concordance", {
			params: {
				query: {
					corpname: props.query.corpus,
					usesubcorp: props.query.subCorpus || undefined,
					viewmode: "kwic",
					...queryStore.getKWICqueryAttrStrcs(props.query),
					refs: props.query.KWICAttrsStructs.structures.map((s: string) => `=${s}`).join(","),
					pagesize: 1000,
					json: JSON.stringify({ concordance_query: facettingQuery.value }),
					format: "json",
				},
			},
		});
		if (error) throw error;
		return data;
	},
});

const KWICresults = computed(() => {
	const data = kwicQuery.data.value;
	if (!data?.Lines) return [];
	return (data.Lines.map(({ Tbl_refs, Left, Kwic, toknum, Right }) => {
		return {
			refs: Tbl_refs,
			date: Tbl_refs?.[1] ?? "",
			source: Tbl_refs?.[3] ?? "",
			region: Tbl_refs?.[2] ?? "",
			left:
				Left?.map(
					(entry) => ("str" in entry ? (entry.str as string | undefined) : undefined) ?? entry.strc,
				).join(" ") ?? "",
			word:
				typeof Kwic?.[0] !== "undefined"
					? Kwic?.reduce((acc, entry) => `${acc} ${(entry as { str?: string }).str ?? ""}`, "")
					: "",
			right: Right?.map((entry) => (entry as { str?: string }).str ?? "").join(" ") ?? "",
			docid: Tbl_refs?.[0] ?? "",
			toknum: toknum ?? 0,
		} as KeywordInContext;
	}) ?? []) as Array<KeywordInContext>;
});

const loading = computed(() => kwicQuery.isPending.value);

function open(item: KeywordInContext) {
	selectedKWIC.value = item;
}

const t = useTranslations();

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
		<div class="flex items-center gap-2">
			<Checkbox id="kwic-view-options" v-model="showViewOptionsMode" />
			<Label for="kwic-view-options">{{ t("viewOptions") }}</Label>
		</div>
		<kwicAttributeSelect v-if="showViewOptionsMode" class="mt-4" :query="query" />
		<div class="mt-4">
			<QueryDisplay :loading="loading" :query="query" :query-key="kwicQueryKey" />
			<CorpsumDataTable v-if="!loading" :columns="columns" :data="KWICresults" />
			<kwicDetailDialog
				v-if="selectedKWIC"
				:kwic="selectedKWIC"
				:query="query"
				@close="selectedKWIC = null"
			/>
		</div>
	</div>
</template>
