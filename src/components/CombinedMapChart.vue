<script setup lang="ts">
import { mapAustria } from "./utils/mapAustria";
// import { CorpusQuery } from "~/types/query";
import { centroidMultiPolygon } from "polygon-utils";
const props = defineProps<{
	queries: Array<CorpusQuery>;
	resdata: Array<Array<never>>;
	mode: string;
}>();
// const props = defineProps(["query"]);

const usedRegion = ["amitte", "aost", "asuedost", "awest"];

function getValue(arr: Array<any>) {
	let max = -1;
	arr.forEach((v) => {
		if (typeof v !== "number" || max > v) return;
		max = v;
	});

	return arr.findIndex((a) => a === max) - 2;
}

const dataByRegion = computed(() => {
	const result = usedRegion.map((r) => [r]);
	props.resdata.forEach((rdata, i) =>
		rdata.map(({ region, relative, absolute }) => {
			const idx = usedRegion.findIndex((r) => r === region);
			// console.log(idx, region);
			if (idx > -1) result[idx]!.push(props.mode === "relative" ? relative : absolute);
		}),
	);

	return result.map((r) => [...r, getValue(r)]);

	// const result = usedRegion.map((r) => [r]);
	// return props.resdata.map((rdata, i) =>
	// 	rdata.map(({ relative, absolute }) => (props.mode === "relative" ? relative : absolute)),
	// );
});

const coordinates = computed(() => {
	const coordinates: Record<Region, Array<number>> = {};
	usedRegion.forEach((region: Region) => {
		// @ts-expect-error
		coordinates[region] = centroidMultiPolygon([
			mapAustria.features.find((feature) => feature.properties["hc-key"] === region)?.geometry
				.coordinates,
		]);
	});
	return coordinates;
});

onMounted(() => {
	console.log(
		// usedRegion.map((region) => ({
		// 	region,
		// 	center: centroidMultiPolygon([
		// 		mapAustria.features.find((feature) => feature.properties["hc-key"] === region)?.geometry
		// 			.coordinates,
		// 	]),
		// })),
		{ coordinates: coordinates.value },
	);
});

// used for the chart; see https://api.highcharts.com/highcharts/tooltip.pointFormatter
function pointFormatter() {
	const queryArray = props.queries
		// @ts-expect-error todo find out how to type thsi function correctly
		.map((query) => [query.userInput, this[query.userInput], query.color])
		.sort((a, b) => b[1] - a[1]);
	// @ts-expect-error todo find out how to type thsi function correctly
	return `<b>${this.id}</b><br/>
${queryArray
	.map(
		(line) =>
			`<span style="color:${line[2]}">\u25CF</span> ${line[0]}: ${Math.floor(line[1] * 100) / 100}<br/>`,
	)
	.join("")}`;
}
const keys = computed(() => ["id", ...props.queries.map((q) => q.userInput), "value"]);

const pieSeries = computed(() =>
	usedRegion.map((region: Region) => {
		const series = mapDataByRegionToPieSeries(
			dataByRegion.value,
			props.queries.map((q) => q.color),
			coordinates.value,
		);
		return series;
	}),
);

const mapDataByRegionToPieSeries = (data, colors, coords) => {
	return data
		.map((regionData) => {
			const [region] = regionData;
			let [_, ...values] = regionData;
			values.pop();
			const [lang, lat] = coords[region];
			if (!lang) return;
			const pieData = values.map((value, index) => ({
				y: value,
				color: colors[index],
			}));

			return {
				type: "pie",
				name: region,
				center: [lang, lat],
				data: pieData,
				size: "15%",
				dataLabels: {
					enabled: false,
				},
			};
		})
		.filter((a) => !!a);
};

const series = computed(() => [
	{
		mapData: mapAustria,
		name: "Austria",
		dataLabels: {
			enabled: true,
			format: "{point.name}",
		},
		joinBy: ["hc-key", "id"],
		allAreas: true,
		data: dataByRegion.value,
		keys: keys.value,
		tooltip: {
			headerFormat: "",
			pointFormatter,
		},
		// data: [{ name: "AT-Mitte", value: 30 }],
	},
	{
		name: "Connectors",
		type: "mapline",
		color: "rgba(130, 130, 130, 0.5)",
		zIndex: 5,
		showInLegend: false,
		enableMouseTracking: false,
		accessibility: {
			enabled: false,
		},
	},
	// {
	// 	type: "pie",
	// 	name: "at-west",
	// 	zIndex: 6, // Keep pies above connector lines
	// 	minSize: 15,
	// 	maxSize: 55,
	// 	onPoint: {
	// 		id: "at-west",
	// 		z: 11,
	// 	},
	// 	states: {
	// 		inactive: {
	// 			enabled: false,
	// 		},
	// 	},
	// 	accessibility: {
	// 		enabled: false,
	// 	},
	// 	tooltip: {
	// 		// Use the region tooltip for the pies as well
	// 		pointFormatter,
	// 	},
	// 	data: dataByRegion.value[3],
	// },
	{
		type: "pie",
		name: "amitte",
		//center: [1518705.2199238702, 6084644.836807582],
		zIndex: 6, // Keep pies above connector lines

		data: [
			{
				y: 13.791194224464975,
				color: "#2ecc71",
			},
			{
				y: 24.3949835367869,
				color: "#f39c12",
			},
			{
				y: 19.94995400868113,
				color: "#9b59b6",
			},
		],
		size: "15%",
		dataLabels: {
			enabled: false,
		},
	},
	//...pieSeries.value,
]);

// @ts-expect-error todo how to type Highchart ref
const chart: Ref<any> = ref(null);

const colorAxis = computed(() => ({
	dataClasses: props.queries.map((query, i) => ({
		from: i - 1,
		to: i,
		color: query.color,
		name: query.userInput,
	})),
}));
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
			animation: false,
		},

		accessibility: {
			description: "Map showing the different query frequencies relating to the region",
		},
		// mapNavigation: {
		// 	enabled: true,
		// },
		colorAxis: colorAxis.value,
		//	max: Number(max) > 10 ? max : 10,
		type: "logarithmic",
		minColor: "#eee",
		// maxColor: props.query.color,
		plotOptions: {
			pie: {
				borderColor: "rgba(255,255,255,0.4)",
				borderWidth: 1,
				clip: true,
				dataLabels: {
					enabled: false,
				},
				states: {
					hover: {
						halo: {
							size: 5,
						},
					},
				},
				tooltip: {
					headerFormat: "",
				},
			},
		},
		title: {
			text: "All Queries in one Chart",
		},
		series: series.value,
	};
});

// onMounted(() => {
// 	   chart.series[0].points.forEach(region => {
//         // Add the pie for this region
//         chart.addSeries({
//             type: 'pie',
//             name: region.id,
//             zIndex: 6, // Keep pies above connector lines
//             minSize: 15,
//             maxSize: 55,
//             onPoint: {
//                 id: region.id,
//                 z: (() => {
//                     const mapView = chart.mapView,
//                         zoomFactor = mapView.zoom / mapView.minZoom;

//                     return Math.max(
//                         chart.chartWidth / 45 * zoomFactor, // Min size
//                         chart.chartWidth /
//                         11 * zoomFactor * region.sumVotes / maxVotes
//                     );
//                 })()
//             },
//             states: {
//                 inactive: {
//                     enabled: false
//                 }
//             },
//             accessibility: {
//                 enabled: false
//             },
//             tooltip: {
//                 // Use the region tooltip for the pies as well
//                 pointFormatter() {
//                     return region.series.tooltipOptions.pointFormatter.call({
//                         id: region.id,
//                         // hoverVotes: this.name,
//                         demVotes: region.demVotes,
//                         repVotes: region.repVotes,
//                         libVotes: region.libVotes,
//                         grnVotes: region.grnVotes,
//                         sumVotes: region.sumVotes
//                     });
//                 }
//             },
//             data: [{
//                 name: 'Democrats',
//                 y: region.demVotes,
//                 color: demColor
//             }, {
//                 name: 'Republicans',
//                 y: region.repVotes,
//                 color: repColor
//             }, {
//                 name: 'Libertarians',
//                 y: region.libVotes,
//                 color: libColor
//             }, {
//                 name: 'Green',
//                 y: region.grnVotes,
//                 color: grnColor
//             }]
//         }, false);
//     });
// })
</script>

<template>
	<div>
		<!-- data {{ chartOptions.series }} -->
		keys {{ keys }}

		pieSeries
		<JsonViewer preview-mode :value="pieSeries" :expand-depth="5" boxed></JsonViewer>
		<!-- colorAxis -->
		<!-- <JsonViewer preview-mode :value="colorAxis" :expand-depth="5" boxed></JsonViewer> -->
		<HighCharts ref="chart" :constructor-type="'mapChart'" :options="chartOptions" />
		<!-- chartOptions {{ chartOptions }} -->
	</div>
	<!-- <HighCharts :constructor-type="'mapChart'" :options="chartWorldOptions" /> -->
</template>
