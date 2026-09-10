<script lang="ts" setup>
import { getKWICColumns } from "@/utils/kwic";
import type { components } from "~/lib/noske-types";

type ConcordanceResponse = components["schemas"]["06_concordance"];

const props = withDefaults(
	defineProps<{
		query: CorpusQuery;
		data?: ConcordanceResponse | null;
		interactive?: boolean;
		allowDetails?: boolean;
		loading?: boolean;
		queryKey?: ReadonlyArray<unknown>;
	}>(),
	{
		data: undefined,
		interactive: true,
		allowDetails: true,
		loading: false,
		queryKey: undefined,
	},
);

const showViewOptionsMode = ref(false);
const viewOptionsId = computed(() => `kwic-view-options-${props.query.id}`);
const selectedKWIC: Ref<KeywordInContext | null> = ref(null);
const t = useTranslations();

const kwicResults = computed<Array<KeywordInContext>>(() =>
	(props.data?.Lines ?? []).map(({ Tbl_refs, Left, Kwic, toknum, Right }) => {
		const refs = Tbl_refs ?? [];
		const refValues = Object.fromEntries(
			props.query.KWICAttrsStructs.structures.map((header, index) => [header, refs[index] ?? ""]),
		);
		return {
			refValues,
			refs,
			date: refValues["doc.datum"] ?? refValues["doc.year"] ?? "",
			source: refValues["doc.docsrc"] ?? "",
			region: refValues["doc.region"] ?? "",
			left:
				Left?.map((entry) => ("str" in entry ? (entry as { str?: string }).str : entry.strc)).join(
					" ",
				) ?? "",
			word: Kwic?.map((entry) => entry.str ?? "").join(" ") ?? "",
			right: Right?.map((entry) => entry.str ?? "").join(" ") ?? "",
			docid: refValues["doc.id"] ?? "",
			topic: "",
			toknum: toknum ?? 0,
		};
	}),
);

function open(item: KeywordInContext) {
	selectedKWIC.value = item;
}

const columns = computed(() =>
	getKWICColumns(
		t as unknown as (key: string) => string,
		open,
		props.query.KWICAttrsStructs.structures,
		props.allowDetails,
	),
);
</script>

<template>
	<div>
		<div v-if="interactive" class="flex items-center gap-2">
			<Checkbox
				:id="viewOptionsId"
				:model-value="showViewOptionsMode"
				@update:model-value="showViewOptionsMode = $event === true"
			/>
			<Label :for="viewOptionsId">{{ t("viewOptions") }}</Label>
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
