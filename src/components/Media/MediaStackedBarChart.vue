<script lang="ts" setup>
const props = defineProps<{
	queries: Array<CorpusQuery>;
	sourceDistributions: Array<Array<IsourceDistribution>>;
	mode: "absolute" | "relative";
	stack: boolean;
}>();

const t = useTranslations("Corpsum");

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
				// @ts-ignore
				.map((a) => (a ? a[props.mode] : 0)),
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

const highChartsOptions = computed(() => ({
	chart: {
		type: "bar",
	},
	title: {
		text: `${series.value.length} ${t("queries")}`,
		align: "center",
	},
	xAxis: {
		categories: categories.value,
	},
	plotOptions: props.stack
		? {
				series: {
					stacking: "normal",
				},
			}
		: {},
	yAxis: {
		title: {
			text: t("sources"),
		},
	},
	series: series.value,
}));
</script>

<template>
	<HighCharts
		v-if="smoothReloadForBarChart"
		style="height: 1200px"
		:options="highChartsOptions"
	></HighCharts>
</template>
