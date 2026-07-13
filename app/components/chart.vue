<script setup lang="ts">
import { GroupedBar, NestedDonut, StackedBar } from "@unovis/ts";
import type { LengthUnit } from "@unovis/ts/types/misc";
import {
	VisAnnotations,
	VisAxis,
	VisAxisSelectors,
	VisGroupedBar,
	VisGroupedBarSelectors,
	VisLine,
	VisLineSelectors,
	VisNestedDonut,
	VisNestedDonutSelectors,
	VisScatter,
	VisScatterSelectors,
	VisSingleContainer,
	VisStackedBar,
	VisStackedBarSelectors,
	VisTooltip,
	VisXYContainer,
} from "@unovis/vue";
import { Maximize2, MoreHorizontal } from "lucide-vue-next";
import { computed, getCurrentInstance, h, ref, render, toRef } from "vue";

import { useChartExport } from "@/composables/use-chart-export";
import { useTranslations } from "@/composables/use-translations";
import {
	alignChartSeriesData,
	getChartTooltipDomainValue,
	type ChartDatum,
} from "@/utils/chart-data";

import { Button } from "./ui/button";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegendContent,
	ChartTooltipContent,
} from "./ui/chart";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type Datum = ChartDatum;
const maximumScatterPointCount = 2_000;
type SeriesData = ChartConfig[string] & {
	data: Array<Datum>;
	name?: string;
};

const props = withDefaults(
	defineProps<{
		series: Array<SeriesData>;
		chartType?: "bar" | "line" | "stack" | "percent" | "donut";
		title?: string;
		xAxis?: string;
		yAxis?: string;
		orientation?: "horizontal" | "vertical";
		height?: number;
		domainType?: "categorical" | "temporal";
		domainValueFormatter?: (value: string | number) => string;
		fillPatterns?: boolean;
	}>(),
	{
		chartType: "bar",
		domainType: "categorical",
		orientation: "vertical",
		fillPatterns: false,
	},
);
const percent = computed(() => props.chartType === "percent");
const chartConfig = computed(() =>
	Object.fromEntries(
		props.series.map((entry) => [
			String(entry.label ?? entry.name).replaceAll(/[ :]+/g, ""),
			{ ...entry, label: entry.label ?? entry.name },
		]),
	),
);
const appContext = getCurrentInstance()?.appContext;

function formatDomainValue(value: string | number) {
	return props.domainValueFormatter?.(value) ?? String(value);
}

function renderTooltipContent(data: Array<ChartDatum>, x?: number | Date) {
	const domainValue = getChartTooltipDomainValue(data, props.domainType, x);
	const vnode = h(ChartTooltipContent, {
		payload: data,
		config: chartConfig.value,
		x: formatDomainValue(domainValue),
	});
	if (appContext) vnode.appContext = appContext;
	const div = document.createElement("div");
	render(vnode, div);
	const html = div.innerHTML;
	render(null, div);
	return html;
}

const chartData = computed(() => alignChartSeriesData(props.series.map((entry) => entry.data)));
const renderScatterPoints = computed(
	() => chartData.value.length * props.series.length <= maximumScatterPointCount,
);
function zip(arrays: Array<Array<Datum>>) {
	return arrays[0]?.map((_, i) => {
		return arrays.map((array) => {
			return array[i];
		});
	});
}

type DonutDatum = { label: string; value: number; color?: string };
const donutData = computed<Array<DonutDatum>>(() =>
	props.series.map((s) => ({
		label: String(s.label ?? s.name ?? ""),
		value: s.data.reduce((sum, d) => sum + (d?.[1] ?? 0), 0),
		color: s.color,
	})),
);
const donutLayers = [(d: DonutDatum) => d.label];
const currentLocale = useLocale();
function donutSegmentLabel(segment: { data?: { values?: Array<DonutDatum> } }) {
	const value = segment.data?.values?.[0]?.value;
	return value != null
		? value.toLocaleString(currentLocale.value, {
				maximumFractionDigits: 2,
			})
		: "";
}
type Data = SeriesData["data"][number];
const tickFormat = (tick: number | Date) => {
	if (props.domainType === "temporal") {
		return formatDomainValue(tick instanceof Date ? tick.getTime() : tick);
	}
	return formatDomainValue(chartData.value?.[Number(tick)]?.[0]?.[0] ?? "");
};
function getDomainPosition(data: Array<Data>, index: number) {
	return props.domainType === "temporal" ? Number(data[0]?.[0] ?? 0) : index;
}
const yTickFormat = (tick: number) => {
	if (percent.value && typeof tick === "number") return `${tick * 100}%`;
	return tick;
};
const yAccessors = computed(() => props.series.map((_, i) => (d: Array<Data>) => d[i]?.[1] ?? 0));
const color = computed(() => props.series.map((s) => s.color));
const patternedColor = computed(() => props.series.map((_, i) => `var(--vis-color${i})`));
const fillColor = computed(() => (props.fillPatterns ? patternedColor.value : color.value));
const patternColorVars = computed(() =>
	props.fillPatterns
		? Object.fromEntries(
				props.series.flatMap((s, i) => (s.color ? [[`--vis-color${i}`, s.color]] : [])),
			)
		: {},
);
const fillPatternCount = 6;
function fillPatternMask(seriesIdx: number) {
	return `var(--vis-pattern-fill${seriesIdx % fillPatternCount})`;
}
const groupedBarAttributes = computed(() =>
	props.fillPatterns
		? {
				[VisGroupedBarSelectors.bar]: {
					mask: (_d: unknown, i: number) => fillPatternMask(i % (props.series.length || 1)),
				},
			}
		: {},
);
const stackedBarAttributes = computed(() =>
	props.fillPatterns
		? {
				[VisStackedBarSelectors.bar]: {
					mask: (d: { stackIndex?: number }) => fillPatternMask(d.stackIndex ?? 0),
				},
			}
		: {},
);
const donutAttributes = computed(() =>
	props.fillPatterns
		? {
				[VisNestedDonutSelectors.segmentArc]: {
					mask: (d: { _index?: number }) => fillPatternMask(d._index ?? 0),
				},
			}
		: {},
);

const titleAnnotation = computed(() => {
	return props.title
		? [
				{
					x: "50%" as LengthUnit,
					content: {
						text: props.title,
						fontSize: 18,
						fontWeight: 600,
					},
					textAlign: "center",
				},
			]
		: [];
});

const containerRef = ref<HTMLElement | null>(null);
let lastSvg: SVGSVGElement | null = null;

const snapPoint = ref<{ x: number; y: number; dataIdx: number; seriesIdx: number } | null>(null);

function getChartSvg() {
	if (lastSvg?.isConnected) return lastSvg;
	return containerRef.value?.querySelector<SVGSVGElement>("svg:not(.lucide)") ?? null;
}

function svgPointToScreen(ptEl: SVGGraphicsElement): { x: number; y: number } | null {
	const ctm = ptEl.getScreenCTM();
	if (!ctm) return null;
	const origin = ptEl.ownerSVGElement!.createSVGPoint();
	const screen = origin.matrixTransform(ctm);
	return { x: screen.x, y: screen.y };
}

function updateSnapPoint(event: MouseEvent, seriesIdx: number) {
	const svg = getChartSvg();
	if (!svg || !containerRef.value) {
		snapPoint.value = null;
		return;
	}
	const groups = svg.querySelectorAll(`.${VisScatterSelectors.pointGroup}`);
	const activeGroup = groups[seriesIdx];
	if (!activeGroup) {
		snapPoint.value = null;
		return;
	}
	const points = Array.from(activeGroup.querySelectorAll(`.${VisScatterSelectors.point}`));
	let closestEl: SVGGraphicsElement | null = null;
	let closestDataIdx = -1;
	let minDist = Infinity;
	points.forEach((pt) => {
		const screen = svgPointToScreen(pt as SVGGraphicsElement);
		if (!screen) return;
		const dist = Math.abs(screen.x - event.clientX);
		// pointIndex is the original data array index, unaffected by viewport filtering
		const dataIdx =
			(pt as unknown as { __data__?: { _point?: { pointIndex?: number } } }).__data__?._point
				?.pointIndex ?? -1;
		if (dist < minDist && dataIdx >= 0) {
			minDist = dist;
			closestEl = pt as SVGGraphicsElement;
			closestDataIdx = dataIdx;
		}
	});
	if (!closestEl || closestDataIdx < 0) {
		snapPoint.value = null;
		return;
	}
	const screen = svgPointToScreen(closestEl);
	if (!screen) {
		snapPoint.value = null;
		return;
	}
	const containerRect = containerRef.value.getBoundingClientRect();
	snapPoint.value = {
		x: screen.x - containerRect.left,
		y: screen.y - containerRect.top,
		dataIdx: closestDataIdx,
		seriesIdx,
	};
}

const snapTooltipPayload = computed(() => {
	if (!snapPoint.value) return [] as Array<ChartDatum>;
	return chartData.value?.[snapPoint.value.dataIdx] ?? [];
});
const snapTooltipTitle = computed(() => {
	const domainValue = snapTooltipPayload.value[0]?.[0];
	return domainValue === undefined ? "" : formatDomainValue(domainValue);
});

function applyBarHoverOpacity(activeIdx: number | null) {
	const svg = getChartSvg();
	if (!svg) return;
	for (const group of svg.querySelectorAll(`.${VisGroupedBarSelectors.barGroup}`)) {
		Array.from(group.children).forEach((child, i) => {
			const el = child as SVGElement;
			el.style.transition = "opacity 50ms ease";
			el.style.opacity = activeIdx === null || activeIdx === i ? "1" : "0.3";
		});
	}
}

function applyLineHoverOpacity(activeIdx: number | null) {
	const svg = getChartSvg();
	if (!svg) return;
	Array.from(svg.querySelectorAll(`.${VisLineSelectors.line}`)).forEach((el, i) => {
		const svgEl = el as SVGElement;
		svgEl.style.transition = "opacity 50ms ease";
		svgEl.style.opacity = activeIdx === null || activeIdx === i ? "1" : "0.3";
	});
	Array.from(svg.querySelectorAll(`.${VisScatterSelectors.pointGroup}`)).forEach((el, i) => {
		const svgEl = el as SVGElement;
		svgEl.style.transition = "opacity 50ms ease";
		svgEl.style.opacity = activeIdx === null || activeIdx === i ? "1" : "0.3";
	});
}

function applyDonutHoverOpacity(activeIdx: number | null) {
	const svg = getChartSvg();
	if (!svg) return;
	svg
		.querySelectorAll(
			`.${VisNestedDonutSelectors.segmentArc}, .${VisNestedDonutSelectors.segmentLabel}`,
		)
		.forEach((el) => {
			const svgEl = el as SVGElement;
			const idx = (svgEl as unknown as { __data__?: { _index?: number } }).__data__?._index;
			svgEl.style.transition = "opacity 50ms ease";
			svgEl.style.opacity = activeIdx === null || activeIdx === idx ? "1" : "0.25";
		});
}

function applySeriesHoverOpacity(activeIdx: number | null) {
	if (props.chartType === "bar") applyBarHoverOpacity(activeIdx);
	else if (props.chartType === "donut") applyDonutHoverOpacity(activeIdx);
	else applyLineHoverOpacity(activeIdx);
}

const barEvents = {
	[VisGroupedBarSelectors.bar]: {
		mouseover: (_d: Array<Data>, event: MouseEvent) => {
			const target = event.target as SVGElement;
			lastSvg = target.closest("svg");
			const idx = Array.from(target.parentElement?.children ?? []).indexOf(target);
			applyBarHoverOpacity(idx);
		},
		mouseleave: () => {
			applyBarHoverOpacity(null);
		},
	},
	[VisGroupedBarSelectors.root]: {
		mouseleave: () => {
			applyBarHoverOpacity(null);
		},
	},
	[VisStackedBarSelectors.bar]: {
		mouseover: (_d: Array<Data>, event: MouseEvent) => {
			const target = event.target as SVGElement;
			lastSvg = target.closest("svg");
			const idx = Array.from(target.parentElement?.children ?? []).indexOf(target);
			applyBarHoverOpacity(idx);
		},
		mouseleave: () => {
			applyBarHoverOpacity(null);
		},
	},
	[VisStackedBarSelectors.root]: {
		mouseleave: () => {
			applyBarHoverOpacity(null);
		},
	},
};
const lineEvents = {
	[VisLineSelectors.line]: {
		mouseover: (_d: Array<Data>, event: MouseEvent) => {
			const target = event.target as SVGElement;
			lastSvg = target.closest("svg");
			const lineEl = target.closest(`.${VisLineSelectors.line}`);
			const idx = lineEl
				? Array.from(lastSvg!.querySelectorAll(`.${VisLineSelectors.line}`)).indexOf(lineEl)
				: -1;
			if (idx >= 0) applyLineHoverOpacity(idx);
		},
		mousemove: (_d: Array<Data>, event: MouseEvent) => {
			const target = event.target as SVGElement;
			lastSvg = target.closest("svg") ?? lastSvg;
			const lineEl = target.closest(`.${VisLineSelectors.line}`);
			const idx = lineEl
				? Array.from(lastSvg!.querySelectorAll(`.${VisLineSelectors.line}`)).indexOf(lineEl)
				: -1;
			if (idx >= 0) updateSnapPoint(event, idx);
		},
		mouseleave: () => {
			applyLineHoverOpacity(null);
			snapPoint.value = null;
		},
	},
	[VisLineSelectors.root]: {
		mouseleave: () => {
			applyLineHoverOpacity(null);
			snapPoint.value = null;
		},
	},
};
const scatterEvents = {
	[VisScatterSelectors.point]: {
		mouseover: (_d: Array<Data>, event: MouseEvent) => {
			const target = event.target as SVGElement;
			lastSvg = target.closest("svg");
			const groupEl = target.closest(`.${VisScatterSelectors.pointGroup}`);
			const seriesIdx = groupEl
				? Array.from(lastSvg!.querySelectorAll(`.${VisScatterSelectors.pointGroup}`)).indexOf(
						groupEl,
					)
				: -1;
			if (seriesIdx < 0) return;
			applyLineHoverOpacity(seriesIdx);
			const datum = _d as unknown as { _point?: { pointIndex?: number } };
			const dataIdx = datum._point?.pointIndex ?? -1;
			const pointEl = target.closest(`.${VisScatterSelectors.point}`) as SVGGraphicsElement | null;
			if (dataIdx < 0 || !pointEl || !lastSvg || !containerRef.value) return;
			const screen = svgPointToScreen(pointEl);
			if (!screen) return;
			const containerRect = containerRef.value.getBoundingClientRect();
			snapPoint.value = {
				x: screen.x - containerRect.left,
				y: screen.y - containerRect.top,
				dataIdx,
				seriesIdx,
			};
		},
		mouseleave: () => {
			applyLineHoverOpacity(null);
			snapPoint.value = null;
		},
	},
	[VisScatterSelectors.root]: {
		mouseleave: () => {
			applyLineHoverOpacity(null);
			snapPoint.value = null;
		},
	},
};

const triggers = computed(() => ({
	[GroupedBar.selectors.bar]: (_data: unknown, x: number) => {
		const data = (
			_data && typeof _data === "object" && "data" in _data ? _data.data : _data
		) as Array<ChartDatum>;
		return renderTooltipContent(data, x);
	},
	[StackedBar.selectors.bar]: (_data: unknown, x: number) => {
		const data = (
			_data && typeof _data === "object" && "datum" in _data ? _data.datum : _data
		) as Array<ChartDatum>;
		return renderTooltipContent(data, x);
	},
}));

const donutEvents = {
	[VisNestedDonutSelectors.segmentArc]: {
		mouseover: (d: { _index?: number }, event: MouseEvent) => {
			const target = event.target as SVGElement;
			lastSvg = target.closest("svg");
			applyDonutHoverOpacity(d?._index ?? null);
		},
		mouseleave: () => {
			applyDonutHoverOpacity(null);
		},
	},
};

const donutTriggers = {
	[NestedDonut.selectors.segmentArc]: (d: { data?: { values?: Array<DonutDatum> } }) => {
		const datum = d?.data?.values?.[0];
		if (!datum) return "";
		return renderTooltipContent(
			[[datum.label, datum.value]],
			undefined,
			{ segment: { label: datum.label, color: datum.color } },
			false,
		);
	},
};

const minTicks = computed(() => {
	return Math.min(15, chartData.value?.length ?? 0);
});
const axisTickValues = computed(() => {
	if (minTicks.value > 3 && props.orientation !== "horizontal") return undefined;
	return chartData.value.map((row, index) =>
		props.domainType === "temporal" ? Number(row[0]?.[0] ?? 0) : index,
	);
});

const t = useTranslations();
const key = ref(0);

function openFullscreen() {
	containerRef.value?.querySelector("div")?.requestFullscreen();
}

const seriesLabels = computed(() => props.series.map((s) => String(s.label ?? s.name ?? "")));
const exportChartData = computed(() =>
	chartData.value.map((row) =>
		row.map(([domainValue, value]) => [formatDomainValue(domainValue), value] satisfies ChartDatum),
	),
);
const { exportCsv, exportXlsx, exportSvg, exportPng, exportJpg } = useChartExport(
	containerRef,
	exportChartData,
	toRef(() => props.title),
	seriesLabels,
	toRef(() => props.xAxis),
);

const axisAttributes = {
	[VisAxisSelectors.grid]: {
		"clip-path": "inset(50px 0 0 0)",
	},
};

function updateKey() {
	if (!document.fullscreenElement) key.value++;
}
</script>

<template>
	<div :key="key" ref="containerRef" class="relative">
		<DropdownMenu v-if="series.length > 0">
			<DropdownMenuTrigger as-child>
				<Button
					class="absolute right-1 top-1 z-10 size-7 text-muted-foreground"
					size="icon"
					variant="ghost"
				>
					<MoreHorizontal class="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem class="text-xs" @click="openFullscreen">
					<Maximize2 class="size-3" />
					{{ t("Chart.fullscreen") }}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem class="text-xs" @click="exportCsv">{{
					t("Chart.export.csv")
				}}</DropdownMenuItem>
				<DropdownMenuItem class="text-xs" @click="exportXlsx">{{
					t("Chart.export.xlsx")
				}}</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem class="text-xs" @click="exportSvg">{{
					t("Chart.export.svg")
				}}</DropdownMenuItem>
				<DropdownMenuItem class="text-xs" @click="exportPng">{{
					t("Chart.export.png")
				}}</DropdownMenuItem>
				<DropdownMenuItem class="text-xs" @click="exportJpg">{{
					t("Chart.export.jpg")
				}}</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
		<ChartContainer
			v-if="series.length > 0"
			class="aspect-auto h-fit min-h-50 w-full [&:fullscreen]:bg-white"
			:config="chartConfig"
			:style="patternColorVars"
			@fullscreenchange="updateKey"
		>
			<VisXYContainer
				v-if="chartType !== 'donut'"
				:data="chartData"
				:height="height"
				:padding="{ top: 50 }"
			>
				<VisAnnotations v-if="title" :items="titleAnnotation"></VisAnnotations>
				<VisAxis
					:full-size="false"
					:grid-line="false"
					:label="xAxis"
					:num-ticks="minTicks"
					:tick-format="tickFormat"
					:tick-text-hide-overlapping="orientation === 'vertical'"
					:tick-values="axisTickValues"
					:type="orientation === 'vertical' ? 'x' : 'y'"
				></VisAxis>
				<VisAxis
					:attributes="orientation !== 'vertical' ? axisAttributes : []"
					:full-size="false"
					:label="yAxis"
					:tick-format="yTickFormat"
					:type="orientation === 'vertical' ? 'y' : 'x'"
				></VisAxis>
				<VisGroupedBar
					v-if="chartType === 'bar'"
					:attributes="groupedBarAttributes"
					:bar-padding="0.25"
					:color="fillColor"
					:events="barEvents"
					:group-padding="0.2"
					:orientation="orientation"
					:rounded-corners="3"
					:x="getDomainPosition"
					:y="yAccessors"
				/>
				<VisStackedBar
					v-if="chartType === 'stack' || chartType === 'percent'"
					:attributes="stackedBarAttributes"
					:bar-padding="0.25"
					:color="fillColor"
					:events="barEvents"
					:group-padding="0.2"
					:orientation="orientation"
					:rounded-corners="3"
					:x="getDomainPosition"
					:y="yAccessors"
				/>
				<template v-if="chartType === 'line'">
					<VisLine :color="color" :events="lineEvents" :x="getDomainPosition" :y="yAccessors" />
					<VisScatter
						v-if="renderScatterPoints"
						:color="color"
						:events="scatterEvents"
						:size="8"
						:x="getDomainPosition"
						:y="yAccessors"
					/>
				</template>

				<VisTooltip :follow-cursor="false" :triggers="triggers"></VisTooltip>
			</VisXYContainer>
			<VisSingleContainer v-else :data="donutData" :height="height" :padding="{ top: 50 }">
				<VisAnnotations v-if="title" :items="titleAnnotation"></VisAnnotations>
				<VisNestedDonut
					:attributes="donutAttributes"
					:events="donutEvents"
					:layers="donutLayers"
					:segment-color="fillColor"
					:segment-label="donutSegmentLabel"
					:value="(d: DonutDatum) => d.value"
					:layerSettings="{ width: 40 }"
				/>
				<VisTooltip :follow-cursor="false" :triggers="donutTriggers"></VisTooltip>
			</VisSingleContainer>
			<ChartLegendContent
				@series-hover="applySeriesHoverOpacity"
				@series-leave="applySeriesHoverOpacity(null)"
			/>
		</ChartContainer>

		<template v-if="chartType === 'line' && snapPoint">
			<div
				class="pointer-events-none absolute rounded-full"
				:style="{
					left: `${snapPoint.x}px`,
					top: `${snapPoint.y}px`,
					transform: 'translate(-50%, -50%)',
					width: '22px',
					height: '22px',
					border: `2px solid ${color[snapPoint.seriesIdx]}`,
					opacity: '0.55',
					transition: 'left 60ms ease, top 60ms ease',
					zIndex: 10,
				}"
			/>
			<div
				class="pointer-events-none absolute z-20"
				:style="{
					left: `${snapPoint.x}px`,
					top: `${snapPoint.y}px`,
					transform: 'translate(-50%, calc(-100% - 14px))',
					transition: 'left 60ms ease, top 60ms ease',
				}"
			>
				<ChartTooltipContent
					:config="chartConfig"
					:payload="snapTooltipPayload"
					:x="snapTooltipTitle"
				/>
			</div>
		</template>
	</div>
</template>
