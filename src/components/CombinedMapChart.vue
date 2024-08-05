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

// data required for pies:
const pieSize = "15%";

interface PieInfo {
	region: Region;
	center: Array<String>;
	// data: {
	// 	y: number;
	// 	name: string;
	// 	color: string;
	// };
}

interface PieInfoWithData extends PieInfo {
	data: Array<{
		y: number;
		name: string;
		color: string;
	}>;
}
const pieInfo: Array<PieInfo> = [
	{ region: "amitte", center: ["54.7%", "25%"] },
	{ region: "aost", center: ["70%", "25%"] },
	{ region: "asuedost", center: ["64.5%", "77.6%"] },
	{ region: "awest", center: ["35%", "49%"] },
];

const pieInfoWithData: ComputedRef<Array<PieInfoWithData>> = computed(() => {
	return dataByRegion.value.map((regionData) => {
		const [region] = regionData;
		let [_, ...values] = regionData;
		values.pop();
		const queryData = props.queries.map((query) => ({
			color: query.color,
			name: query.userInput,
		}));
		const data = values.map((value, index) => ({
			y: value,
			...queryData[index],
			// color: colors[index],
		}));
		return {
			region: region,
			data,
			center: pieInfo.find((pInfo) => pInfo.region === region)?.center,
		};
	});
});

const centerPercentages = [
	["54.7%", "25%"],
	["70%", "25%"],
	["64.5%", "77.6%"],
	["35%", "49%"],
];

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
	pieInfoWithData.value.map((piwd) => ({
		type: "pie",
		zIndex: 6,
		size: "15%",
		...piwd,
		region: undefined,
		name: piwd.region,
		dataLabels: {
			enabled: false,
		},
	})),
);

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
	// ...centerPercentages.map(([x, y]) => ({
	// 	type: "pie",
	// 	name: "amitte",
	// 	center: [x, y],

	// 	// center: chart.value.fromLatLonToPoint(1518705.2199238702, 6084644.836807582),
	// 	zIndex: 6, // Keep pies above connector lines

	// 	data: [
	// 		{
	// 			y: 13.791194224464975,
	// 			color: "#2ecc71",
	// 			name: "fish",
	// 		},
	// 		{
	// 			y: 24.3949835367869,
	// 			color: "#f39c12",
	// 			name: "fleisch",
	// 		},
	// 		{
	// 			y: 19.94995400868113,
	// 			color: "#9b59b6",
	// 			name: "brot",
	// 		},
	// 	],
	// 	size: "15%",
	// 	dataLabels: {
	// 		enabled: false,
	// 	},
	// 	tooltip: {
	// 		// pointFormat: "{point.name}asdfsdaf: <b>{point.y}</b>",
	// 	},
	// })),

	...pieSeries.value,
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
			},
		},
		title: {
			text: "All Queries in one Chart",
		},
		series: series.value,
	};
});

onMounted(() => {
	setTimeout(() => {
		console.log({
			chart: chart.value.chart,
			coords: chart.value.chart.mapView.lonLatToPixels({
				lat: 43,
				lon: 21,
			}),
		});
	}, 1000);
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

		shit that works
		<JsonViewer
			preview-mode
			:value="
				centerPercentages.map(([x, y]) => ({
					type: 'pie',
					name: 'amitte',
					center: [x, y],

					// center: chart.value.fromLatLonToPoint(1518705.2199238702, 6084644.836807582),
					zIndex: 6, // Keep pies above connector lines

					data: [
						{
							y: 13.791194224464975,
							color: '#2ecc71',
							name: 'fish',
						},
						{
							y: 24.3949835367869,
							color: '#f39c12',
							name: 'fleisch',
						},
						{
							y: 19.94995400868113,
							color: '#9b59b6',
							name: 'brot',
						},
					],
					size: '15%',
					dataLabels: {
						enabled: false,
					},
				}))
			"
			:expand-depth="5"
			boxed
		></JsonViewer>
		pie
		<JsonViewer preview-mode :value="pieSeries" :expand-depth="5" boxed></JsonViewer>

		<!-- colorAxis -->
		<!-- <JsonViewer preview-mode :value="colorAxis" :expand-depth="5" boxed></JsonViewer> -->
		<HighCharts ref="chart" :constructor-type="'mapChart'" :options="chartOptions" />
		<!-- chartOptions {{ chartOptions }} -->
	</div>
	<!-- <HighCharts :constructor-type="'mapChart'" :options="chartWorldOptions" /> -->
</template>
