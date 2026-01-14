<script setup lang="ts">
import { mapAustria } from "@/utils/map-austria";

const props = defineProps<{
	query: CorpusQuery;
	resdata: Array<RegionalFreqData>;
	mode: string;
}>();

const usedRegion = ["amitte", "aost", "asuedost", "awest"];

const chartOptions = computed(() => {
	const data = props.resdata.map(({ region, relative, absolute }) => [
		region,
		props.mode === "relative" ? relative : absolute,
	]);
	const max = data
		.filter(([region]) => {
			return usedRegion.includes(region as string);
		})
		.map(([, value]) => value)
		.reduce((a, b) => Number(Number(a) > Number(b) ? a : b), 0);
	return {
		chart: {
			map: mapAustria,
		},

		colorAxis: {
			max: Number(max) > 10 ? max : 10,
			type: "logarithmic",
			minColor: "#eee",
			maxColor: props.query.color,
		},
		title: {
			text: props.query.userInput,
		},
		series: [
			{
				name: "Austria",

				dataLabels: {
					enabled: true,
					format: "{point.name}",
				},
				allAreas: true,
				data,
			},
		],
	};
});
</script>

<template>
	<div>
		<HighCharts :constructor-type="'mapChart'" :options="chartOptions" />
	</div>
</template>
