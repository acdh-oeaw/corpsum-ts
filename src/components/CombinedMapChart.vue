<script setup lang="ts">
import { mapAustria } from "./utils/mapAustria";

const props = defineProps<{
	queries: Array<CorpusQuery>;
	resdata: Array<Array<never>>;
	mode: string;
}>();

const t = useTranslations("Corpsum");

const usedRegion = ["amitte", "aost", "asuedost", "awest"];

// data required for pies:
const pieSize = "15%";

interface PieInfo {
	region: Region;
	center: Array<string>;
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
			y: Math.round(value * 100) / 100,
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
			if (idx > -1) result[idx]!.push(props.mode === "relative" ? relative : absolute);
		}),
	);

	return result.map((r) => [...r, getValue(r)]);
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
			`<span style="color:${line[2]}">\u25CF</span> ${line[0]}: ${Math.round(line[1] * 100) / 100}<br/>`,
	)
	.join("")}`;
}
const keys = computed(() => ["id", ...props.queries.map((q) => q.userInput), "value"]);

const pieSeries = computed(() =>
	pieInfoWithData.value.map((piwd) => ({
		type: "pie",
		zIndex: 6,
		size: pieSize,
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
	...pieSeries.value,
]);

const colorAxis = computed(() => ({
	dataClasses: props.queries.map((query, i) => ({
		from: i - 1,
		to: i,
		color: query.color,
		name: query.userInput,
	})),
}));

const chartOptions = computed(() => {
	return {
		chart: {
			map: mapAustria,
			animation: false,
		},
		accessibility: {
			description: t("map-showing-the-different-query-frequencies-relating-to-the-region"),
		},
		colorAxis: colorAxis.value,

		type: "logarithmic",
		minColor: "#eee",
		title: {
			text: t("all-queries-in-one-chart"),
		},
		series: series.value,
	};
});
</script>

<template>
	<div>
		<HighCharts :constructor-type="'mapChart'" :options="chartOptions" />
	</div>
</template>
