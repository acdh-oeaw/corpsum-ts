<script lang="ts" setup>
// @eslint-ignore-next-line
type legalAny = unknown;

const props = defineProps<{
	queries: Array<CorpusQuery>;
	datatype: SearchFunctionKey;
	loading: Array<boolean>;
	data: Array<Array<legalAny>>;
}>();
const tab = ref(null);

const columns = computed(() => {
	if (!props.data[0]?.[0]) return [];
	return Object.keys(props.data[0][0]).map((key) => {
		return {
			accessorKey: key,
			header: () => h("div", { class: "text-right" }, key),
			// @ts-ignore this comes from tanstack-table
			cell: ({ row }) => {
				const value = row.getValue(key);
				return h("div", { class: "text-right font-medium" }, value as string);
			},
		};
	});
});
</script>

<template>
	<VCard>
		<VTabs v-model="tab">
			<div v-for="query of props.queries" :key="query.id">
				<VTab :value="query.id">
					<span :style="`color: ${query.color}`">{{ query.type }}: {{ query.userInput }}</span>
				</VTab>
			</div>
		</VTabs>

		<VCardText>
			<VWindow v-model="tab">
				<div v-for="(query, index) of props.queries" :key="query.id">
					<VWindowItem :value="query.id">
						<div>
							<QueryDisplay :loading="loading[index]" :query="query" />
							<CorpsumDataTable v-if="!loading[index]" :columns="columns" :data="data[index]!" />
						</div>
					</VWindowItem>
				</div>
			</VWindow>
		</VCardText>
	</VCard>
</template>
