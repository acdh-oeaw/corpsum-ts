<script lang="ts" setup>
const props = defineProps<{
	queries: Array<CorpusQuery>;
	datatype: SearchFunctionKey;
	loading: Array<boolean>;
	data: Array<never>;
}>();
const tab = ref(null);

const columns = computed(() => {
	if (!props.data || !props.data[0] || !props.data[0][0]) return [];
	return Object.keys(props.data[0][0]).map((key) => {
		console.log({ key });

		return {
			accessorKey: key,
			header: () => h("div", { class: "text-right" }, key),
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
						<div v-if="!loading[index]">
							<QueryDisplay :query="query" />
							<CorpsumDataTable :columns="columns" :data="data[index]" />
						</div>
						<VProgressCircular v-else :color="query.color" indeterminate></VProgressCircular>
					</VWindowItem>
				</div>
			</VWindow>
		</VCardText>
	</VCard>
</template>
