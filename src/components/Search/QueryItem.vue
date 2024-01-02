<script setup lang="ts">
import { useQuery } from "../../stores/query";

const props = defineProps<{ query: CorpusQuery }>();
const queries = useQuery();

const i = queries.queries.findIndex((q) => q.id === props.query.id);
const storeQuery = queries.queries.find((q) => q.id === props.query.id) as unknown as CorpusQuery;
</script>

<template>
	<VCard :key="props.query.id" :style="`border: 2px solid ${props.query.color};`">
		<!-- <p>id: {{ props.query.id }}</p> -->
		<VCardTitle>
			<div class="flex justify-between gap-2">
				<div class="flex gap-1">
					<VBtn density="compact" icon="mdi-trash-can" @click="queries.queries.splice(i, 1)"></VBtn>
					<VBtn
						density="compact"
						icon="mdi-palette"
						@click="storeQuery.showPicker = !storeQuery.showPicker"
					></VBtn>
				</div>
				<span class="text-xl" :style="`color: ${props.query.color}`">
					{{ props.query.userInput }}
					<VTooltip activator="parent">{{ props.query.userInput }}</VTooltip>
				</span>
			</div>

			<div class="mt-2 flex items-center justify-between"></div>
		</VCardTitle>

		<VCardText class="flex justify-between" :style="`color: ${props.query.color}`">
			<JsonViewer preview-mode :value="query.concordance_query" boxed></JsonViewer>
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
