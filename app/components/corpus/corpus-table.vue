<script setup lang="ts">
import {
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	getPaginationRowModel,
	useVueTable,
	type ColumnDef,
	type SortingState,
	type ColumnFiltersState,
} from "@tanstack/vue-table";

import type { components } from "~/lib/noske-types";

type CorpusTableItem = components["schemas"]["03_corpora_list"] & {
	noskeId: string;
	baseUrl: string;
};
const props = defineProps<{ corpora: Array<CorpusTableItem> }>();
const corpora = computed(() => props.corpora);
const t = useTranslations();
const locale = useLocale();
const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const expanded = ref<Record<string, boolean>>({});
const metadata = ref<Record<string, components["schemas"]["01_corp_info"]>>({});
const columns: Array<ColumnDef<CorpusTableItem>> = [
	{ id: "corpus", accessorFn: (row) => getCorpusQueryValue(row) },
	{ id: "words", accessorFn: (row) => row.sizes?.wordcount, enableColumnFilter: false },
	{ id: "documents", accessorFn: (row) => row.sizes?.doccount, enableColumnFilter: false },
	{ id: "language", accessorFn: (row) => row.language_name ?? "" },
];
const table = useVueTable({
	get data() {
		return corpora.value;
	},
	columns,
	state: {
		get sorting() {
			return sorting.value;
		},
		get columnFilters() {
			return columnFilters.value;
		},
	},
	onSortingChange: (value) => {
		sorting.value = typeof value === "function" ? value(sorting.value) : value;
	},
	onColumnFiltersChange: (value) => {
		columnFilters.value = typeof value === "function" ? value(columnFilters.value) : value;
	},
	getCoreRowModel: getCoreRowModel(),
	getFilteredRowModel: getFilteredRowModel(),
	getSortedRowModel: getSortedRowModel(),
	getPaginationRowModel: getPaginationRowModel(),
	initialState: { pagination: { pageSize: 100 } },
});
let generation = 0;
const loadMetadata = async (items: Array<CorpusTableItem>, current: number) => {
	let index = 0;
	await Promise.all(
		Array.from({ length: 4 }, async () => {
			while (index < items.length && current === generation) {
				const item = items[index++]!;
				const id = item.noskeId;
				const corpus = getCorpusQueryValue(item);
				const key = `${id}:${corpus}`;
				if (!corpus || metadata.value[key]) continue;
				try {
					const data = await $fetch<components["schemas"]["01_corp_info"]>(
						`/api/noske/${id}/search/corp_info`,
						{ query: { corpname: corpus } },
					);
					if (current === generation) metadata.value[key] = data;
				} catch {
					/* A missing metadata response must not hide the corpus. */
				}
			}
		}),
	);
};
watch(
	[corpora],
	() => {
		generation++;
		metadata.value = {};
		void loadMetadata(corpora.value.slice(0, 100), generation);
	},
	{ immediate: true },
);
watch(
	() => table.getRowModel().rows.map((row) => row.original),
	(rows) => {
		void loadMetadata(rows, generation);
	},
);
function descriptionUrl(info: components["schemas"]["01_corp_info"] | undefined, baseUrl: string) {
	try {
		if (!info?.infohref || !baseUrl) return null;
		const url = new URL(info.infohref, baseUrl);
		return ["http:", "https:"].includes(url.protocol) ? url.href : null;
	} catch {
		return null;
	}
}
function compiledDate(value?: string) {
	const match = value?.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
	if (!match) return "—";
	const date = new Date(Date.UTC(Number(match[3]), Number(match[1]) - 1, Number(match[2])));
	if (
		date.getUTCFullYear() !== Number(match[3]) ||
		date.getUTCMonth() !== Number(match[1]) - 1 ||
		date.getUTCDate() !== Number(match[2])
	)
		return "—";
	return new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeZone: "UTC" }).format(
		date,
	);
}

function formatCount(value?: number) {
	return typeof value === "number" ? value.toLocaleString() : "—";
}

function getCorpusQueryValue(corpus: CorpusTableItem) {
	if (corpus.corpname) return corpus.corpname;
	return corpus.id != null ? String(corpus.id) : "";
}
</script>

<template>
	<div class="mt-3 overflow-x-auto rounded-md border">
		<Table
			><TableHeader
				><TableRow>
					<TableHead
						v-for="header in [
							...table.getAllLeafColumns().map((column) => ({
								id: column.id,
								column,
								label: t(`NoskeInstanceDetail.columns.${column.id}`),
							})),
							{ id: 'compiled', column: null, label: t('NoskeInstanceDetail.compiled') },
							{ id: 'actions', column: null, label: t('NoskeInstanceDetail.actions') },
						]"
						:key="header.id"
					>
						<div class="flex items-center gap-2">
							<TableSortButton
								v-if="header.column"
								:sorted="header.column.getIsSorted()"
								@click="header.column.toggleSorting(header.column.getIsSorted() === 'asc')"
								>{{ header.label }}</TableSortButton
							>
							<span v-else>{{ header.label }}</span>
							<Input
								v-if="header.column && (header.id === 'corpus' || header.id === 'language')"
								class="h-8 w-32"
								:aria-label="`${t('NoskeInstanceDetail.filter')}: ${header.label}`"
								:placeholder="t('NoskeInstanceDetail.filter')"
								@input="header.column.setFilterValue(($event.target as HTMLInputElement).value)"
							/>
						</div>
					</TableHead> </TableRow></TableHeader
			><TableBody>
				<template v-for="row in table.getRowModel().rows" :key="row.id">
					<TableRow>
						<TableCell
							><p class="font-medium">
								{{
									metadata[`${row.original.noskeId}:${getCorpusQueryValue(row.original)}`]?.name ||
									getCorpusQueryValue(row.original) ||
									"—"
								}}
							</p>
							<p class="text-xs text-muted-foreground">
								{{ getCorpusQueryValue(row.original) }}
							</p></TableCell
						>
						<TableCell>{{ formatCount(row.original.sizes?.wordcount) }}</TableCell
						><TableCell>{{ formatCount(row.original.sizes?.doccount) }}</TableCell
						><TableCell>{{ row.original.language_name ?? "—" }}</TableCell>
						<TableCell>{{
							compiledDate(
								metadata[`${row.original.noskeId}:${getCorpusQueryValue(row.original)}`]?.compiled,
							)
						}}</TableCell>
						<TableCell
							><TooltipProvider :delay-duration="150"
								><div class="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
									<Tooltip v-if="getCorpusQueryValue(row.original)"
										><TooltipTrigger as-child
											><Button as-child size="sm" variant="ghost"
												><NuxtLinkLocale
													:aria-label="t('NoskeInstanceDetail.createQuery')"
													:href="{
														path: '/query/edit/new',
														query: {
															noske: row.original.noskeId,
															corpus: getCorpusQueryValue(row.original),
														},
													}"
													><LucideIcon
														name="Plus"
														class="size-4"
														:stroke-width="2" /></NuxtLinkLocale></Button></TooltipTrigger
										><TooltipContent>{{
											t("NoskeInstanceDetail.createQuery")
										}}</TooltipContent></Tooltip
									>
									<Tooltip
										><TooltipTrigger as-child
											><Button
												size="sm"
												variant="ghost"
												:aria-label="t('NoskeInstanceDetail.tagset')"
												:aria-expanded="Boolean(expanded[row.id])"
												@click="expanded[row.id] = !expanded[row.id]"
												><LucideIcon
													name="Tags"
													class="size-4"
													:stroke-width="2" /></Button></TooltipTrigger
										><TooltipContent>{{ t("NoskeInstanceDetail.tagset") }}</TooltipContent></Tooltip
									>
									<Tooltip
										v-if="
											descriptionUrl(
												metadata[`${row.original.noskeId}:${getCorpusQueryValue(row.original)}`],
												row.original.baseUrl,
											)
										"
										><TooltipTrigger as-child
											><Button as-child size="sm" variant="ghost"
												><a
													:href="
														descriptionUrl(
															metadata[
																`${row.original.noskeId}:${getCorpusQueryValue(row.original)}`
															],
															row.original.baseUrl,
														)!
													"
													target="_blank"
													rel="noopener noreferrer"
													:aria-label="t('NoskeInstanceDetail.viewDescription')"
													><LucideIcon
														name="ExternalLink"
														class="size-4"
														:stroke-width="2" /></a></Button></TooltipTrigger
										><TooltipContent>{{
											t("NoskeInstanceDetail.viewDescription")
										}}</TooltipContent></Tooltip
									>
								</div></TooltipProvider
							></TableCell
						>
					</TableRow>
					<TableRow v-if="expanded[row.id]"
						><TableCell colspan="6"
							><template
								v-if="
									metadata[`${row.original.noskeId}:${getCorpusQueryValue(row.original)}`]
										?.tagsetdoc ||
									metadata[`${row.original.noskeId}:${getCorpusQueryValue(row.original)}`]?.wposlist
										?.length ||
									metadata[`${row.original.noskeId}:${getCorpusQueryValue(row.original)}`]?.lposlist
										?.length
								"
								><a
									v-if="
										descriptionUrl(
											{
												infohref:
													metadata[`${row.original.noskeId}:${getCorpusQueryValue(row.original)}`]
														?.tagsetdoc,
											},
											row.original.baseUrl,
										)
									"
									:href="
										descriptionUrl(
											{
												infohref:
													metadata[`${row.original.noskeId}:${getCorpusQueryValue(row.original)}`]
														?.tagsetdoc,
											},
											row.original.baseUrl,
										)!
									"
									target="_blank"
									rel="noopener noreferrer"
									class="text-primary underline"
									>{{ t("NoskeInstanceDetail.tagsetDocumentation") }}</a
								>
								<p
									v-for="(pair, index) in [
										...(metadata[`${row.original.noskeId}:${getCorpusQueryValue(row.original)}`]
											?.wposlist ?? []),
										...(metadata[`${row.original.noskeId}:${getCorpusQueryValue(row.original)}`]
											?.lposlist ?? []),
									]"
									:key="index"
								>
									{{ pair.join(" — ") }}
								</p></template
							><span v-else>—</span></TableCell
						></TableRow
					>
				</template>
				<TableRow v-if="!table.getRowModel().rows.length"
					><TableCell colspan="6">{{ t("NoskeInstanceDetail.emptyCorpora") }}</TableCell></TableRow
				>
			</TableBody></Table
		>
		<div class="flex items-center justify-end gap-2 p-3">
			<Button
				variant="outline"
				size="sm"
				:disabled="!table.getCanPreviousPage()"
				@click="table.previousPage()"
				>{{ t("previous") }}</Button
			><span
				>{{ table.getState().pagination.pageIndex + 1 }} /
				{{ Math.max(1, table.getPageCount()) }}</span
			><Button
				variant="outline"
				size="sm"
				:disabled="!table.getCanNextPage()"
				@click="table.nextPage()"
				>{{ t("next") }}</Button
			>
		</div>
	</div>
</template>
