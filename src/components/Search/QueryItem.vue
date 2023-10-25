<script setup lang="ts">
import { useQuery } from "../../stores/query";

const props = defineProps<{ query: CorpusQuery }>();
const queries = useQuery();

const i = queries.queries.findIndex((q) => q.id === props.query.id);
const storeQuery = queries.queries.find((q) => q.id === props.query.id) as unknown as CorpusQuery;
</script>

<template>
	<v-card
		:key="props.query.id"
		width="30rem"
		:style="`border: 2px solid ${props.query.color}`"
		border=""
	>
		<!-- <p>id: {{ props.query.id }}</p> -->
		<v-card-title>
			<div class="flex items-center justify-between">
				<span class="text-xl" :style="`color: ${props.query.color}`">
					{{ props.query.finalQuery }}
				</span>
				<div class="flex gap-2">
					<v-chip>{{ props.query.type }}</v-chip>
					<v-btn
						density="compact"
						icon="mdi-palette"
						@click="storeQuery.showPicker = !storeQuery.showPicker"
					></v-btn>
					<v-btn
						density="compact"
						icon="mdi-trash-can"
						@click="queries.queries.splice(i, 1)"
					></v-btn>
				</div>
			</div>
		</v-card-title>
		<v-card-text v-if="storeQuery.showPicker">
			<!-- <p>userInput: {{ props.query.userInput }}</p> -->
			<v-color-picker v-if="storeQuery.showPicker" v-model="storeQuery.color"></v-color-picker>
		</v-card-text>
	</v-card>
</template>
