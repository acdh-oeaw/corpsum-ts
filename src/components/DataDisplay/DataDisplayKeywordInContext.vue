<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";
import { type Ref } from "vue";
import type {
	ColumnDef,
	ColumnFiltersState,
	ExpandedState,
	SortingState,
	VisibilityState,
} from "@tanstack/vue-table";

import { type Type06Concordance } from "~/lib/api-client";

import CorpusChip from "../Search/CorpusChip.vue";
import KWICDetailDialog from "./KWICDetailDialog.vue";

const t = useTranslations("Corpsum");
const queryStore = useQueryStore();

const { queries } = storeToRefs(queryStore);

const KWICColumns: Array<ColumnDef<KeywordInContext>> = [
	{
		accessorKey: "docid",
		header: () => h("div", { class: "text-right" }, "docid"),
		cell: ({ row }) => {
			const docid = row.getValue("docid");
			return h("div", { class: "text-right font-medium" }, docid as string);
		},
	},
	{
		accessorKey: "source",
		header: () => h("div", { class: "text-right" }, "source"),
		cell: ({ row }) => {
			const source = row.getValue("source");
			return h("div", { class: "text-right font-medium" }, source as string);
		},
	},
	{
		accessorKey: "region",
		header: () => h("div", { class: "text-right" }, "region"),
		cell: ({ row }) => {
			const region = row.getValue("region");
			return h("div", { class: "text-right font-medium" }, region as string);
		},
	},
	{
		accessorKey: "left",
		header: () => h("div", { class: "text-right" }, "left"),
		cell: ({ row }) => {
			const left = row.getValue("left");
			return h("div", { class: "text-right font-medium" }, left as string);
		},
	},
	{
		accessorKey: "word",
		header: () => h("div", { class: "text-right" }, "word"),
		cell: ({ row }) => {
			const word = row.getValue("word");
			return h("div", { class: "text-right font-medium" }, word as string);
		},
	},
	{
		accessorKey: "right",
		header: () => h("div", { class: "text-right" }, "right"),
		cell: ({ row }) => {
			const right = row.getValue("right");
			return h("div", { class: "text-right font-medium" }, right as string);
		},
	},
	// todo check how to properly do the link
	// {
	// 	accessorKey: 'link',
	// 	header: () => h('div', { class: 'text-right' }, 'Open'),
	// 	cell: ({ row }) => {
	// 		const link = row.getValue('link')
	// 			// <  size = "" class="me-2" icon = "mdi-open-in-new" @click="open(item)" />
	// 		return h('VIcon', { size: 'small', icon: "mdi-open-in-new", 'on-click': open(item)   class: 'me-2' }, `${link}`)
	// 	}
	// },
];

const headers = ref([
	{ title: t("docid"), key: "docid", type: "string" },
	// { title: t("date"), key: "date", type: "string" },
	{ title: t("source"), key: "source", type: "string" },
	{ title: t("region"), key: "region", type: "string" },
	{ title: t("left"), key: "left", type: "string" },
	{ title: t("word"), key: "word", type: "string" },
	{ title: t("right"), key: "right", type: "string" },
	// { title: t("topic"), key: "topic", type: "string" },
	// { title: t("toknum"), key: "toknum", type: "string" },
	{ title: t("link"), key: "open", type: "string" },
]);

const api = useApiClient();

const showViewOptionsMode = ref(false);
const KWICresults: Ref<Array<Array<never>>> = ref([]);
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
				//@ts-expect-error TODO properly type this
				KWICresults.value[index] =
					data.Lines?.map(({ Tbl_refs, Left, Kwic, toknum, Right }) => {
						// this mapping is directly taken from the ancient code
						return {
							refs: Tbl_refs,
							date: Tbl_refs![1] ?? "",
							source: Tbl_refs![4] ?? "",
							region: Tbl_refs![2] ?? "",
							// @ts-expect-error TODO properly type this
							left: Left!.map(({ str }: { str: string }) => str).join(" "),
							word: typeof Kwic![0] !== "undefined" ? Kwic![0].str : "",
							// @ts-expect-error TODO properly type this
							right: Right!.map(({ str }: { str: string }) => str).join(" "),
							docid: Tbl_refs![0] ?? "",
							topic: Tbl_refs![3] ?? "",
							toknum,
						};
					}) ?? [];
				KWICresultsLoading.value[index] = false;
			},
		};
	}),
);

function refresh() {
	console.error("NEEDS IMPEMENTATION");
}

//@ts-expect-error TODO find out how to properly type this
useQueries({ queries: q });

function open(item: KeywordInContext) {
	selectedKWIC.value = item;
}

const selectedKWIC: Ref<KeywordInContext | null> = ref(null);
const showIds = ref(false);

const columns = KWICColumns;
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
				<KWICAttributeSelect v-if="showViewOptionsMode" :query="query" @refresh="refresh()" />
				<div>
					<QueryDisplay :query="query" :loading="KWICresultsLoading[index]" />
					<span v-if="!KWICresultsLoading[index]">
						{{ KWICresults[index] }}
					</span>
					<KWICDataTable :columns="columns" :data="[]" />
					<!--<VDataTable
						v-if="!KWICresultsLoading[index]"
						density="compact"
						:headers="headers"
						item-value="docid"
						:items="KWICresults[index] as KeywordInContext[]"
						dense
					>
						<template #[`item.open`]="{ item }">
							<VIcon size="small" class="me-2" icon="mdi-open-in-new" @click="open(item)" />
						</template>
						<template #[`item.docid`]="{ item }">
							<div class="group relative inline-block cursor-pointer">
								<div v-if="showIds" @click="showIds = false">
									{{ item.docid }}
								</div>
								<div v-else :title="item.docid" @click="showIds = true">
									...{{ item.docid.slice(-5) }}
								</div>
							</div>
						</template>
					</VDataTable> -->
					<KWICDetailDialog
						v-if="selectedKWIC"
						:query="query"
						:kwic="selectedKWIC"
						@close="selectedKWIC = null"
					/>
				</div>
			</div>
		</VCardText>

		<VDivider></VDivider>
	</VCard>
</template>
