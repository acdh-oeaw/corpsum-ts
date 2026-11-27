<script setup lang="ts" generic="TData, TValue">
import {
	type ColumnDef,
	FlexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useVueTable,
} from "@tanstack/vue-table";

const props = defineProps<{
	columns: Array<ColumnDef<TData, TValue>>;
	data: Array<TData>;
}>();

const sorting = ref<SortingState>([]);

const table = useVueTable({
	state: {
		get sorting() {
			return sorting.value;
		},
	},
	onSortingChange: (value) => {
		sorting.value = typeof value === "function" ? value(sorting.value) : value;
	},
	getSortedRowModel: getSortedRowModel(),
	get data() {
		return props.data;
	},
	get columns() {
		return props.columns;
	},
	getCoreRowModel: getCoreRowModel(),
	getPaginationRowModel: getPaginationRowModel(),
});

const t = useTranslations();
</script>

<template>
	<div class="overflow-x-auto rounded-md border">
		<Table class="relative w-full text-nowrap">
			<TableHeader>
				<TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
					<TableHead v-for="header in headerGroup.headers" :key="header.id">
						<template v-if="!header.isPlaceholder">
							<TableSortButton
								v-if="header.column.getCanSort()"
								:sorted="header.column.getIsSorted()"
								@click="header.column.toggleSorting(header.column.getIsSorted() === 'asc')"
								><FlexRender :props="header.getContext()" :render="header.column.columnDef.header"
							/></TableSortButton>
							<FlexRender
								v-else
								:props="header.getContext()"
								:render="header.column.columnDef.header"
							/>
						</template>
					</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				<template v-if="table.getRowModel().rows?.length">
					<TableRow
						v-for="row in table.getRowModel().rows"
						:key="row.id"
						:data-state="row.getIsSelected() ? 'selected' : undefined"
					>
						<TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
							<FlexRender :props="cell.getContext()" :render="cell.column.columnDef.cell" />
						</TableCell>
					</TableRow>
				</template>
				<template v-else>
					<TableRow>
						<TableCell class="h-24 text-center" :colspan="columns.length">
							{{ t("No results.") }}
						</TableCell>
					</TableRow>
				</template>
			</TableBody>
		</Table>
		<div class="flex items-center justify-end gap-2 p-3">
			<div class="flex-1 text-sm">
				{{ table.getState().pagination.pageIndex + 1 }} / {{ table.getPageCount() }}.
				<!-- @vue-ignore -->
				{{ $t("Corpsum.total-of-n-entries", [data?.length || 0]) }}
			</div>
			<div class="space-x-2">
				<Button
					:disabled="!table.getCanPreviousPage()"
					size="sm"
					variant="outline"
					@click="table.previousPage()"
				>
					{{ t("previous") }}
				</Button>
				<Button
					:disabled="!table.getCanNextPage()"
					size="sm"
					variant="outline"
					@click="table.nextPage()"
				>
					{{ t("next") }}
				</Button>
			</div>
		</div>
	</div>
</template>
