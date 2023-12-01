<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed } from "vue";

const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);

const expand = ref(false);
const series = computed(() =>
	queries.value
		.filter((q: CorpusQuery) => !q.loading.yearlyFrequencies)
		.map((query: CorpusQuery) => ({
			name: query.userInput,
			data: query.data.yearlyFrequencies
				.sort((a, b) => b.year - a.year)
				.map((point) => [point.year, point.relative]),
			color: query.color,
		})),
);
</script>

<template>
	<VCard>
		<VCardItem>
			<template #subtitle>
				<!-- <v-icon icon="mdi-alert" size="18" color="error" class="me-1 pb-1"></v-icon> -->
				<!-- shows absolute and relative Values. -->
			</template>
		</VCardItem>

		<VCardText class="py-0">
			<HighCharts
				:options="{
					series,
					title: {
						text: 'Yearly Frequencies', // Specify your chart title here
						align: 'center', // Alignment of the title (default is 'center')
						// style: {
						// 	color: 'blue', // Text color
						//	fontSize: '18px', // Font size
						// Add more style options as needed
						//},
						// Add more title options as needed
					},
				}"
			></HighCharts>
		</VCardText>

		<VExpandTransition v-if="expand">
			<div class="grid grid-cols-4 gap-2">
				<!-- {{ queries.length }} -->
				<!-- <div v-for="query of queries" :key="query.id" :style="`border: 2px solid ${query.color}`"> -->
				<div v-for="query of queries" :key="query.id">
					<div v-if="!query.loading.yearlyFrequencies">
						<span :style="`color: ${query.color}`">
							{{ query.finalQuery }}
						</span>
						<VDataTable :items="query.data.yearlyFrequencies" density="compact" />
					</div>
					<VProgressCircular v-else :color="query.color" indeterminate></VProgressCircular>
				</div>
			</div>
		</VExpandTransition>

		<VDivider></VDivider>

		<VCardActions>
			<VBtn variant="outlined" size="small" @click="expand = !expand">
				{{ !expand ? "Show Data" : "Hide Data" }}
			</VBtn>
		</VCardActions>
	</VCard>
</template>
