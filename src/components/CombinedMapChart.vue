<script setup lang="ts">
import { mapAustria } from "./utils/mapAustria";

const props = defineProps<{
	queries: Array<CorpusQuery>;
	resdata: Array<RegionalFrequency>;
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
// change these values to change the position of the pies
const pieInfo: Array<PieInfo> = [
	{ region: "amitte", center: ["54.7%", "25%"] },
	{ region: "aost", center: ["70%", "25%"] },
	{ region: "asuedost", center: ["60.5%", "77.6%"] },
	{ region: "awest", center: ["35%", "49%"] },
];

const pieInfoWithData: ComputedRef<Array<PieInfoWithData>> = computed(() => {
	return dataByRegion.value.map((regionData) => {
		const [region] = regionData;
		const [_, ...values] = regionData;
		values.pop();
		const queryData = props.queries.map((query) => ({
			color: query.color,
			name: query.userInput,
		}));
		const data = values.map(
			(value, index) =>
				({
					y: Math.round(Number(value) * 100) / 100,
					...queryData[index],
					// color: colors[index],
				}) as { y: number; name: string; color: string },
		);
		return {
			region: region as Region,
			data,
			center: pieInfo.find((pInfo) => pInfo.region === region)!.center,
		};
	});
});

// calculates biggest value and sets it as index
function getValue(arr: Array<number | string>) {
	let max = -1;
	arr.forEach((v) => {
		if (typeof v !== "number" || max > v) return;
		max = v;
	});
	return arr.findIndex((a) => a === max) - 2;
}

const dataByRegion = computed(() => {
	const result: Array<Array<number | string>> = usedRegion.map((r) => [r]);
	props.resdata.forEach((rdata) =>
		rdata.data.forEach(({ region, relative, absolute }) => {
			const idx = usedRegion.findIndex((r) => r === region);
			if (idx > -1) result[idx]!.push(props.mode === "relative" ? relative : absolute);
		}),
	);
	return result.map((r) => [...r, getValue(r)]);
});

// used for the chart; see https://api.highcharts.com/highcharts/tooltip.pointFormatter
function pointFormatter() {
	const queryArray = props.queries
		// @ts-expect-error todo find out how to type this function correctly
		.map((query) => [query.userInput, this[query.userInput], query.color])
		.sort((a, b) => b[1] - a[1]);
	// @ts-expect-error once again highcharts interal funciton, this is okay
	return `<b>${this.id}</b><br/>
${queryArray
	.map(
		(line) =>
			`<span style="color:${line[2]}">\u25CF</span> ${line[0]}: ${Math.round(line[1] * 100) / 100} <br />`,
	)
	.join("")}`;
}
const keys = computed(() => ["id", ...props.queries.map((q) => q.userInput), "value"]);

const pieSeries = computed(() =>
	pieInfoWithData.value.map((piwd) => ({
		type: "pie",
		id: `pie-${piwd.region}`,
		zIndex: 6,
		size: pieSize,
		...piwd,
		region: undefined,
		name: piwd.region,
		custom: {
			region: piwd.region,
		},
		dataLabels: {
			enabled: false,
		},
		tooltip: {
			pointFormat: `<span style="color:{point.color}">\u25CF</span> <b>{point.name}</b>: {point.y} ({point.percentage:.1f}%)`,
		},
	})),
);

const series = computed(() => [
	{
		id: "austria-regions",
		mapData: mapAustria,
		name: "Austria",
		dataLabels: {
			enabled: true,
			format: "{point.name}",
			allowOverlap: true,
			crop: false,
			overflow: "allow",
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
			events: {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				render: function (this: any) {
					const chart = this as typeof this & {
						__isSyncingPieCenters?: boolean;
					};
					if (chart.__isSyncingPieCenters) return;

					const mapSeries = chart.get("austria-regions");
					if (!mapSeries || mapSeries.type !== "map") return;

					let needsRedraw = false;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					chart.series.forEach((s: any) => {
						if (s.type !== "pie") return;

						const linkedRegion = s.userOptions.custom?.region as Region | undefined;
						if (!linkedRegion) return;
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const regionPoint = mapSeries.points.find((point: any) => point.id === linkedRegion);
						if (!regionPoint) return;
						if (typeof regionPoint.plotX !== "number" || typeof regionPoint.plotY !== "number")
							return;

						const shape = regionPoint.shapeArgs as
							| { x?: number; y?: number; width?: number; height?: number }
							| undefined;
						const hasShapeCenter =
							typeof shape?.x === "number" &&
							typeof shape?.y === "number" &&
							typeof shape?.width === "number" &&
							typeof shape?.height === "number";
						const sx = shape?.x ?? 0;
						const sy = shape?.y ?? 0;
						const sw = shape?.width ?? 0;
						const sh = shape?.height ?? 0;
						const nextCenter: [number, number] = hasShapeCenter
							? [sx + sw / 2, sy + sh / 2]
							: [regionPoint.plotX, regionPoint.plotY];
						const currentCenter = s.options.center;
						const currentX = typeof currentCenter?.[0] === "number" ? currentCenter[0] : NaN;
						const currentY = typeof currentCenter?.[1] === "number" ? currentCenter[1] : NaN;

						if (
							Math.abs(currentX - nextCenter[0]) < 0.5 &&
							Math.abs(currentY - nextCenter[1]) < 0.5
						)
							return;

						s.update({ center: nextCenter }, false);
						needsRedraw = true;
					});

					if (needsRedraw) {
						chart.__isSyncingPieCenters = true;
						chart.redraw(false);
						chart.__isSyncingPieCenters = false;
					}

					// Keep region labels exactly above their corresponding pies.
					const piePositions = new Map<Region, { x: number; y: number; radius: number }>();
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					chart.series.forEach((s: any) => {
						if (s.type !== "pie") return;
						const linkedRegion = s.userOptions.custom?.region as Region | undefined;
						if (!linkedRegion) return;
						const cx = typeof s.center?.[0] === "number" ? s.center[0] : undefined;
						const cy = typeof s.center?.[1] === "number" ? s.center[1] : undefined;
						const diameter = typeof s.center?.[2] === "number" ? s.center[2] : undefined;
						if (cx == null || cy == null || diameter == null) return;
						piePositions.set(linkedRegion, { x: cx, y: cy, radius: diameter / 2 });
					});

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					mapSeries.points.forEach((point: any) => {
						const region = point.id as Region | undefined;
						if (!region) return;
						const piePos = piePositions.get(region);
						if (!piePos) return;
						const label = point.dataLabel;
						if (!label) return;

						const yOffset = 18;
						label.attr({
							x: piePos.x,
							y: piePos.y - piePos.radius - yOffset,
						});
						label.css({ textAnchor: "middle" });
					});
				},
			},
		},
		accessibility: {
			description: t("map-showing-the-different-query-frequencies-relating-to-the-region"),
		},
		colorAxis: colorAxis.value,
		exporting: {
			scale: 1,
			sourceWidth: 1200,
			width: 1200,
		},
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
