<script lang="ts" setup>
const props = defineProps<{ queries: CorpusQuery[]; datatype: SearchFunctionKey }>();
const t = useTranslations("Corpsum");
const tab = ref(null);
</script>

<template>
	<v-card>
		<v-tabs v-model="tab">
			<div v-for="query of props.queries" :key="query.id">
				<v-tab :value="query.id"><span :style="`color: ${query.color}`">{{ query.type }}: {{ query.userInput }}</span></v-tab>
			</div>
		</v-tabs>

		<v-card-text>
			<v-window v-model="tab">
				<div v-for="query of props.queries" :key="query.id">
					<v-window-item :value="query.id">
						<div v-if="!query.loading[props.datatype]">
							<span :style="`color: ${query.color}`">
								<CorpusChip :query="query" />
							</span>
							<VDataTable :items="query.data[props.datatype]" density="compact" />
						</div>
						<VProgressCircular v-else :color="query.color" indeterminate></VProgressCircular>
					</v-window-item>
				</div>
			</v-window>
		</v-card-text>
	</v-card>
</template>
