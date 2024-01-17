<script lang="ts" setup>
const props = defineProps<{ queries: Array<CorpusQuery>; datatype: SearchFunctionKey }>();
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
				<div v-for="query of props.queries" :key="query.id">
					<VWindowItem :value="query.id">
						<div v-if="!query.loading[props.datatype]">
							<span :style="`color: ${query.color}`">
								<CorpusChip :query="query" />
							</span>
							<VDataTable :items="query.data[props.datatype]" density="compact" />
						</div>
						<VProgressCircular v-else :color="query.color" indeterminate></VProgressCircular>
					</VWindowItem>
				</div>
			</VWindow>
		</VCardText>
	</VCard>
</template>
