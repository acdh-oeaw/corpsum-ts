<script lang="ts" setup>
type LegalAny = unknown;

const props = defineProps<{
	queries: Array<CorpusQuery>;
	datatype: SearchFunctionKey;
	loading: Array<boolean>;
	data: Array<Array<LegalAny>>;
}>();

const tab = ref<string>("");

watchEffect(() => {
	if (!tab.value && props.queries.length > 0) {
		tab.value = String(props.queries[0]?.id ?? "");
	}
});

const columns = computed(() => {
	if (!props.data[0]?.[0]) return [];
	return Object.keys(props.data[0][0]).map((key) => {
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
					<CorpsumDataTable v-if="!loading[index]" :columns="columns" :data="data[index]!" />
				</TabsContent>
			</CardContent>
		</Tabs>
	</Card>
</template>
