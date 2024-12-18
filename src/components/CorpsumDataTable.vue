<script setup lang="ts" generic="TData, TValue">
import {
	type ColumnDef,
	FlexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useVueTable,
} from "@tanstack/vue-table";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const props = defineProps<{
	columns: Array<ColumnDef<TData, TValue>>;
	data: Array<TData>;
}>();

const table = useVueTable({
	get data() {
		return props.data;
	},
	get columns() {
		return props.columns;
	},
	getCoreRowModel: getCoreRowModel(),
	getPaginationRowModel: getPaginationRowModel(),
});

const t = useTranslations("Corpsum");
</script>

<template>
	<div class="rounded-md border">
		<Table class="relative w-full text-nowrap">
			<TableHeader>
				<TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
					<TableHead v-for="header in headerGroup.headers" :key="header.id">
						<FlexRender
							v-if="!header.isPlaceholder"
							:props="header.getContext()"
							:render="header.column.columnDef.header"
						/>
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
		<div class="flex items-center justify-end space-x-2 py-4">
			<div class="ml-2 flex-1 text-sm">
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
					class="mr-2"
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
