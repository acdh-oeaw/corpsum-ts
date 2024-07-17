<script setup lang="ts">
import { mapAustria } from "./utils/mapAustria";
// import { CorpusQuery } from "~/types/query";

const props = defineProps<{ query: CorpusQuery; resdata: Array<never>; mode: string }>();
// const props = defineProps(["query"]);

const usedRegion = ["amitte", "aost", "asuedost", "awest"];

const chartOptions = computed(() => {
	const data = props.resdata.map(({ region, relative, absolute }) => [
		region,
		props.mode === "relative" ? relative : absolute,
	]);
	const max = data
		.filter(([region]) => {
			// console.log({ region });
			return usedRegion.includes(region as unknown as string);
		})
		.map(([, a]) => a)
		.reduce((a, b) => Number(Number(a) > Number(b) ? a : b), 0);
	// console.log({ max });
	return {
		chart: {
			map: mapAustria,
		},

		// mapNavigation: {
		// 	enabled: true,
		// },
		colorAxis: {
			// min: 0.1,
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
				// data: [{ name: "AT-Mitte", value: 30 }],
			},
		],
	};
});
</script>

<template>
	<HighCharts :constructor-type="'mapChart'" :options="chartOptions" />
	<!-- <HighCharts :constructor-type="'mapChart'" :options="chartWorldOptions" /> -->
</template>
