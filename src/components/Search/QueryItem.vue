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
			<span class="text-xl" :style="`color: ${props.query.color}`">
				{{ props.query.finalQuery }}
				<VTooltip activator="parent">{{ props.query.finalQuery }}</VTooltip>
			</span>

			<div class="flex items-center justify-between">
				<div class="flex gap-2">
					<VBtn
						density="compact"
						icon="mdi-palette"
						@click="storeQuery.showPicker = !storeQuery.showPicker"
					></VBtn>
					<VBtn density="compact" icon="mdi-trash-can" @click="queries.queries.splice(i, 1)"></VBtn>
				</div>
			</div>
		</VCardTitle>

		<VCardText class="flex justify-between">
			<VChip>
				{{ props.query.corpus }}
				{{ props.query.subCorpus ? ` / ${props.query.subCorpus}` : "" }}
			</VChip>
			<VChip>{{ props.query.type }}</VChip>
			<!-- <p>userInput: {{ props.query.userInput }}</p> -->
		</VCardText>

		<VCardActions v-if="storeQuery.showPicker">
			<VExpandTransition v-if="storeQuery.showPicker">
				<VColorPicker v-model="storeQuery.color"></VColorPicker>
			</VExpandTransition>
		</VCardActions>
	</VCard>
</template>
