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
			name: `${query.type}: ${query.userInput} ${query.corpus}${
				query.subCorpus ? ` / ${query.subCorpus}` : ""
			}`,
			data: categories.value
				.map((category) => query.data.mediaSources.find(({ media }) => category === media))
				// @ts-ignore
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

		<VCardText>
			<VBtnToggle v-model="mode" density="compact">
				<VBtn variant="outlined" value="absolute">Absolute</VBtn>

				<VBtn variant="outlined" value="relative">Relative</VBtn>
			</VBtnToggle>
			<div v-for="query of queries" :key="query.id">
				<div v-if="query.loading.mediaSources">
					<VProgressCircular :color="query.color" indeterminate></VProgressCircular>
					<span :style="`color: ${query.color}`">{{ query.type }}: {{ query.userInput }}</span>
				</div>
			</div>
			<HighCharts
				style="height: 1200px"
				:options="{
					chart: {
						type: 'bar',
					},
					title: {
						text: 'Media Source Distribution',
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
		</VCardText>

		<VExpandTransition v-if="expand">
			<div class="m-2 grid grid-cols-2 gap-2">
				<!-- {{ queries.length }} -->
				<!-- <div v-for="query of queries" :key="query.id" :style="`border: 2px solid ${query.color}`"> -->
				<div v-for="query of queries" :key="query.id">
					<div v-if="!query.loading.mediaSources">
						<span :style="`color: ${query.color}`">
							{{ query.type }}: {{ query.userInput }}
							<CorpusChip :query="query" />
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
