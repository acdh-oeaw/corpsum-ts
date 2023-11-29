<script setup lang="ts">
import { useQuery } from "../../stores/query";

const props = defineProps<{ query: CorpusQuery }>();
const queries = useQuery();

const i = queries.queries.findIndex((q) => q.id === props.query.id);
const storeQuery = queries.queries.find((q) => q.id === props.query.id) as unknown as CorpusQuery;
</script>

<template>
	<VCard :key="props.query.id" width="30rem" :style="`border: 2px solid ${props.query.color}`">
		<!-- <p>id: {{ props.query.id }}</p> -->
		<VCardTitle>
			<div class="flex items-center justify-between">
				<span class="text-xl" :style="`color: ${props.query.color}`">
					{{ props.query.finalQuery }}
				</span>
				<div class="flex gap-2">
					<VChip>{{ props.query.type }}</VChip>
					<VBtn
						density="compact"
						icon="mdi-palette"
						@click="storeQuery.showPicker = !storeQuery.showPicker"
					></VBtn>
					<VBtn density="compact" icon="mdi-trash-can" @click="queries.queries.splice(i, 1)"></VBtn>
				</div>
			</div>
		</VCardTitle>
		<VCardText v-if="storeQuery.showPicker">
			<!-- <p>userInput: {{ props.query.userInput }}</p> -->
			<VColorPicker v-if="storeQuery.showPicker" v-model="storeQuery.color"></VColorPicker>
		</VCardText>
	</VCard>
</template>
