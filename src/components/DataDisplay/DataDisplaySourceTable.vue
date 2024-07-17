<script lang="ts" setup>
const props = defineProps<{
	queries: Array<CorpusQuery>;
	datatype: SearchFunctionKey;
	loading: Array<boolean>;
	data: Array<never>;
}>();
const tab = ref(null);
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
							<span :style="`color: ${query.color}`">
								<CorpusChip :query="query" />
							</span>
							<VDataTable :items="data" density="compact" />
						</div>
						<VProgressCircular v-else :color="query.color" indeterminate></VProgressCircular>
					</VWindowItem>
				</div>
			</VWindow>
		</VCardText>
	</VCard>
</template>
