<script setup>
import { mapAustria } from "~/assets/mapAustria.ts";
// import { CorpusQuery } from "~/types/query";

const props = defineProps({ query: { type: CorpusQuery } });
// const props = defineProps(["query"]);

const usedRegion = ["amitte", "aost", "asuedost", "awest"];

const chartOptions = computed(() => {
	const data = props.query.data.regionalFrequencies.map(({ region, relative }) => [
		region,
		relative,
	]);
	const max = data
		.filter(([region]) => {
			// console.log({ region });
			return usedRegion.includes(region);
		})
		.map(([, a]) => a)
		.reduce((a, b) => (a > b ? a : b), 0);
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
			max: max > 10 ? max : 10,
			type: "logarithmic",
			minColor: "#eee",
			maxColor: props.query.color,
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
