<script lang="ts" setup>
import { storeToRefs } from "pinia";

const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);

const categories = computed(() => {
	const allCats: Array<string> = [];
	queries.value.forEach((query: CorpusQuery) => {
		query.data.mediaSources.forEach((qm) => allCats.push(qm.media));
	});
	return [...new Set(allCats)];
});
const mode = ref("relative");
const series = computed(() => {
	const allSeries = queries.value.map((query: CorpusQuery) => {
		return {
			color: query.color,
			name: query.finalQuery,
			data: categories.value
				.map((category) => query.data.mediaSources.find(({ media }) => category === media))
				.map((a) => (a ? a[mode.value] : 0)),
		};
	});
	return allSeries;
});

const expand = ref(false);
</script>

<template>
	<VCard>
		<VCardItem title="Media Sources">
			<template #subtitle>
				<!-- <v-icon icon="mdi-alert" size="18" color="error" class="me-1 pb-1"></v-icon> -->
				shows absolute and relative Values.
			</template>
		</VCardItem>

		<VCardText class="py-0">
			<HighCharts
				:options="{
					chart: {
						type: 'bar',
					},
					title: {
						text: 'Highcharts Bar Chart',
					},
					xAxis: {
						categories: categories,
					},

					yAxis: {
						title: {
							text: 'sources',
						},
					},
					series,
				}"
			></HighCharts>
			<div v-for="query of queries" :key="query.id">
				<div v-if="!query.loading.mediaSources">
					<ClientOnly></ClientOnly>
				</div>
				<VProgressCircular v-else :color="query.color" indeterminate></VProgressCircular>
			</div>
		</VCardText>

		<VExpandTransition v-if="expand">
			<div class="grid grid-cols-3 gap-2">
				<!-- {{ queries.length }} -->
				<!-- <div v-for="query of queries" :key="query.id" :style="`border: 2px solid ${query.color}`"> -->
				<div v-for="query of queries" :key="query.id">
					<div v-if="!query.loading.regionalFrequencies">
						<span :style="`color: ${query.color}`">
							{{ query.finalQuery }}
						</span>
						<VDataTable :items="query.data.mediaSources" density="compact" />
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
