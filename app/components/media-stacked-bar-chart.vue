<script lang="ts" setup>
type Mode = "absolute" | "relative";
const props = defineProps<{
	queries: Array<CorpusQuery>;
	sourceDistributions: Array<Array<IsourceDistribution>>;
	mode: Mode;
	chartMode: "stack" | "bar" | "percent";
	sortOrder?: "ascending" | "descending";
}>();

const t = useTranslations();

const categories = computed(() => [
	...new Set(
		props.sourceDistributions.flatMap((distribution) => distribution.map(({ media }) => media)),
	),
]);

const series = computed(() => {
	return props.queries.map((query: CorpusQuery, i) => {
		return {
			color: query.color,
			name: `${query.type}: ${query.userInput} (${query.corpus}${
				query.subCorpus ? ` / ${query.subCorpus})` : ")"
			}`,
			data: categories.value
				.map((category) => props.sourceDistributions[i]?.find(({ media }) => category === media))
				.map((entry) => (entry ? entry[props.mode] : 0))
				.map((entry, idx) => [categories.value[idx], entry] as [string, number]),
		};
	});
});
const smoothReloadForBarChart = ref(true);
watch(
	() => props.chartMode,
	() => {
		smoothReloadForBarChart.value = false;
		setTimeout(() => {
			smoothReloadForBarChart.value = true;
		}, 1);
	},
);
</script>

<template>
	<Chart
		:chart-type="chartMode"
		:sort-order="sortOrder ?? 'descending'"
		orientation="horizontal"
		:series="series"
		:title="`${series.length} ${t('queries')}`"
		:y-axis="t('sources')"
	></Chart>
</template>
