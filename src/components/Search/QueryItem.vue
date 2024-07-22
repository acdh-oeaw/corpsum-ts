<script setup lang="ts">
import { useQueryStore } from "../../stores/query";

const props = defineProps<{ query: CorpusQuery }>();
const queries = useQueryStore();

const storeQuery = queries.queries.find((q) => q.id === props.query.id) as unknown as CorpusQuery;

const deleteQuery = () => {
	const i = queries.queries.findIndex((q) => q.id === props.query.id);
	queries.queries.splice(i, 1);
};

const setFilters = computed(() => {
	const keys = Object.keys(props.query.facettingValues).filter(
		(key) => props.query.facettingValues[key]?.length || props.query.facettingValues[key]?.val,
	);
	keys;
	return keys;
});

const queryWithFacetting = computed(() => queries.getQueryWithFacetting(props.query));

const showFacettingInterface = ref(false);
</script>

<template>
	<VCard :key="props.query.id" :style="`border: 2px solid ${props.query.color};`">
		<VCardTitle>
			<div class="flex justify-between gap-2">
				<div class="flex gap-1">
					<VBtn density="compact" icon="mdi-trash-can" @click="deleteQuery()"></VBtn>
					<VBtn
						density="compact"
						icon="mdi-palette"
						@click="storeQuery.showPicker = !storeQuery.showPicker"
					></VBtn>

					<VBadge
						location="bottom end"
						:color="query.color"
						v-if="setFilters.length"
						:content="setFilters.length"
					>
						<VBtn density="compact" icon="mdi-filter" @click="showFacettingInterface = true"></VBtn>
					</VBadge>
					<VBtn
						v-else
						density="compact"
						icon="mdi-filter"
						@click="showFacettingInterface = true"
					></VBtn>
				</div>

				<span class="text-xl" :style="`color: ${props.query.color}`">
					{{ props.query.userInput }}
					<VTooltip activator="parent">{{ props.query.userInput }}</VTooltip>
				</span>
			</div>

			<div class="mt-2 flex items-center justify-between"></div>
		</VCardTitle>

		<div v-if="showFacettingInterface">
			<FacettingModal :query="storeQuery" @close="showFacettingInterface = false" />
		</div>

		<VCardText class="flex justify-between gap-1" :style="`color: ${props.query.color}`">
			<div class="flex justify-between flex-col">
				<!-- <JsonViewer preview-mode :value="query.concordance_query" boxed></JsonViewer> -->
				<JsonViewer preview-mode :value="queryWithFacetting" boxed></JsonViewer>
				<JsonViewer preview-mode :value="query.KWICAttrsStructs" boxed></JsonViewer>
			</div>
			<div class="flex flex-col gap-1">
				<CorpusChip :query="query"></CorpusChip>
				<VChip>{{ props.query.type }}</VChip>
			</div>
			<!-- <p>userInput: {{ props.query.userInput }}</p> -->
		</VCardText>

		<VCardActions v-if="storeQuery.showPicker">
			<VExpandTransition v-if="storeQuery.showPicker">
				<VColorPicker v-model="storeQuery.color"></VColorPicker>
			</VExpandTransition>
		</VCardActions>
	</VCard>
</template>
