<script lang="ts" setup>
import { fixedKWICStructures } from "@/utils/corpus-query";
import { getKWICColumns } from "@/utils/kwic";
import type { components } from "~/lib/noske-types";

type ConcordanceResponse = components["schemas"]["06_concordance"];

const props = withDefaults(
	defineProps<{
		query: CorpusQuery;
		data?: ConcordanceResponse | null;
		interactive?: boolean;
		loading?: boolean;
		queryKey?: ReadonlyArray<unknown>;
	}>(),
	{
		data: undefined,
		interactive: true,
		loading: false,
		queryKey: undefined,
	},
);

const showViewOptionsMode = ref(false);
const selectedKWIC: Ref<KeywordInContext | null> = ref(null);
const t = useTranslations();

const kwicResults = computed<Array<KeywordInContext>>(() =>
	(props.data?.Lines ?? []).map(({ Tbl_refs, Left, Kwic, toknum, Right }) => ({
		refs: Tbl_refs ?? [],
		date: Tbl_refs?.[1] ?? "",
		source: Tbl_refs?.[3] ?? "",
		region: Tbl_refs?.[2] ?? "",
		left:
			Left?.map((entry) => ("str" in entry ? (entry as { str?: string }).str : entry.strc)).join(
				" ",
			) ?? "",
		word: Kwic?.map((entry) => entry.str ?? "").join(" ") ?? "",
		right: Right?.map((entry) => entry.str ?? "").join(" ") ?? "",
		docid: Tbl_refs?.[0] ?? "",
		topic: "",
		toknum: toknum ?? 0,
	})),
);

function open(item: KeywordInContext) {
	selectedKWIC.value = item;
}

const columns = computed(() =>
	getKWICColumns(
		t as unknown as (key: string) => string,
		open,
		props.query.KWICAttrsStructs.structures,
		fixedKWICStructures,
	),
);
</script>

<template>
	<div>
		<div v-if="interactive" class="flex items-center gap-2">
			<Checkbox id="kwic-view-options" v-model="showViewOptionsMode" />
			<Label for="kwic-view-options">{{ t("viewOptions") }}</Label>
		</div>
		<KwicAttributeSelect v-if="interactive && showViewOptionsMode" class="mt-4" :query="query" />
		<div class="mt-4">
			<QueryDisplay :loading="loading" :query="query" :query-key="queryKey" />
			<CorpsumDataTable v-if="!loading" :columns="columns" :data="kwicResults" />
			<KwicDetailDialog
				v-if="selectedKWIC"
				:kwic="selectedKWIC"
				:query="query"
				@close="selectedKWIC = null"
			/>
		</div>
	</div>
</template>
