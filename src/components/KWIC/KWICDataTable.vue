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
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
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
</script>

<template>
	<div class="border rounded-md">
		<Table>
			<TableHeader>
				<TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
					<TableHead v-for="header in headerGroup.headers" :key="header.id">
						<FlexRender
							v-if="!header.isPlaceholder"
							:render="header.column.columnDef.header"
							:props="header.getContext()"
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
							<FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
						</TableCell>
					</TableRow>
				</template>
				<template v-else>
					<TableRow>
						<TableCell :colspan="columns.length" class="h-24 text-center">No results.</TableCell>
					</TableRow>
				</template>
			</TableBody>
		</Table>
		<div class="flex items-center justify-end space-x-2 py-4">
			<div class="flex-1 text-sm text-muted-foreground ml-2">
				{{ table.getState().pagination.pageIndex }} / {{ table.getPageCount() }}. Total of
				{{ data.length }} entries.
			</div>
			<div class="space-x-2">
				<Button
					variant="outline"
					size="sm"
					:disabled="!table.getCanPreviousPage()"
					@click="table.previousPage()"
				>
					Previous
				</Button>
				<Button
					variant="outline"
					class="mr-2"
					size="sm"
					:disabled="!table.getCanNextPage()"
					@click="table.nextPage()"
				>
					Next
				</Button>
			</div>
		</div>
	</div>
</template>
