<script lang="ts" setup>
type LegalAny = unknown;

const props = defineProps<{
	queries: Array<CorpusQuery>;
	datatype: SearchFunctionKey;
	loading: Array<boolean>;
	data: Array<Array<LegalAny>>;
}>();

const tab = ref<string>("");

const queryIds = computed(() => props.queries.map((query) => String(query.id)));

watch(
	queryIds,
	(ids) => {
		if (!ids.includes(tab.value)) {
			tab.value = ids[0] ?? "";
		}
	},
	{ flush: "sync", immediate: true },
);

function createColumns(row: LegalAny | undefined) {
	if (row == null || typeof row !== "object") return [];

	return Object.keys(row).map((key) => {
		return {
			accessorKey: key,
			header: () => h("div", { class: "text-right" }, key),
			// @ts-expect-error tanstack table typing
			cell: ({ row }) => {
				const value = row.getValue(key);
				return h("div", { class: "text-right font-medium" }, value as string);
			},
		};
	});
}

const columnsByQuery = computed(() => {
	return props.queries.map((_, index) => createColumns(props.data[index]?.[0]));
});
</script>

<template>
	<Card>
		<Tabs v-model="tab">
			<TabsList class="flex flex-wrap">
				<TabsTrigger v-for="query in props.queries" :key="query.id" :value="String(query.id)">
					<span :style="`color: ${query.color}`">{{ query.type }}: {{ query.userInput }}</span>
				</TabsTrigger>
			</TabsList>

			<CardContent class="pt-4">
				<TabsContent
					v-for="(query, index) in props.queries"
					:key="query.id"
					:value="String(query.id)"
				>
					<QueryDisplay :loading="loading[index]" :query="query" />
					<CorpsumDataTable
						v-if="!loading[index]"
						:columns="columnsByQuery[index] ?? []"
						:data="data[index] ?? []"
					/>
				</TabsContent>
			</CardContent>
		</Tabs>
	</Card>
</template>
