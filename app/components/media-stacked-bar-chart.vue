<script lang="ts" setup>
type Mode = "absolute" | "relative";
const props = defineProps<{
	queries: Array<CorpusQuery>;
	sourceDistributions: Array<Array<IsourceDistribution>>;
	mode: Mode;
	stack: boolean;
}>();

const t = useTranslations();

const categories = computed(() => {
	const allCats: Array<string> = [];

	const mediaSorting: Record<string, number> = {};

	props.queries.forEach((query: CorpusQuery, i) => {
		props.sourceDistributions[i]?.forEach((qm) => {
			if (!mediaSorting[qm.media]) mediaSorting[qm.media] = 0;
			mediaSorting[qm.media]! += qm[props.mode];
			allCats.push(qm.media);
		});
	});
	return [...new Set(allCats)].sort((a, b) => mediaSorting[b]! - mediaSorting[a]!);
});

const series = computed(() => {
	const allSeries = props.queries.map((query: CorpusQuery, i) => {
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
	return allSeries;
});
const smoothReloadForBarChart = ref(true);
watch(
	() => props.stack,
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
		:chart-type="props.stack ? 'stack' : 'bar'"
		:height="1200"
		orientation="horizontal"
		:series="series"
		:title="`${series.length} ${t('queries')}`"
		:y-axis="t('sources')"
	></Chart>
</template>
