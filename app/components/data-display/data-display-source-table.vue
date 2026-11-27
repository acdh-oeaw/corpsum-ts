<script lang="ts" setup>
import FetchErrorAlert from "@/components/fetch-error-alert.vue";
type LegalAny = unknown;

const props = defineProps<{
	queries: Array<CorpusQuery>;
	datatype: SearchFunctionKey;
	loading: Array<boolean>;
	errors?: Array<string | null>;
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
			header: () => h("div", key),
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
					<FetchErrorAlert v-if="errors?.[index]" :message="errors[index]" />
					<CorpsumDataTable
						v-if="!loading[index] && (!errors?.[index] || (data[index]?.length ?? 0) > 0)"
						:columns="columnsByQuery[index] ?? []"
						:data="data[index] ?? []"
					/>
				</TabsContent>
			</CardContent>
		</Tabs>
	</Card>
</template>
