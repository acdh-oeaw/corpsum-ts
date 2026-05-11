<script setup lang="ts">
import { GroupedBar, StackedBar } from "@unovis/ts";
import type { LengthUnit } from "@unovis/ts/types/misc";
import {
	VisAnnotations,
	VisAxis,
	VisAxisSelectors,
	VisGroupedBar,
	VisGroupedBarSelectors,
	VisLine,
	VisLineSelectors,
	VisScatter,
	VisScatterSelectors,
	VisStackedBar,
	VisStackedBarSelectors,
	VisTooltip,
	VisXYContainer,
} from "@unovis/vue";
import { MoreHorizontal } from "lucide-vue-next";
import { h, render } from "vue";

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
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type IntervalFrequencyPoint = [yearRange: string, value: number];
type FrequencyPoint = [year: number, value: number];
type SeriesData = ChartConfig[string] & {
	data: Array<IntervalFrequencyPoint | FrequencyPoint>;
	name?: string;
};

const props = withDefaults(
	defineProps<{
		series: Array<SeriesData>;
		chartType?: "bar" | "line" | "stack";
		title?: string;
		xAxis?: string;
		yAxis?: string;
		orientation?: "horizontal" | "vertical";
		height?: number;
	}>(),
	{
		chartType: "bar",
		orientation: "vertical",
	},
);
const chartConfig = computed(() =>
	Object.fromEntries(
		props.series.map((entry) => [
			String(entry.label ?? entry.name).replaceAll(/[ :]+/g, ""),
			{ ...entry, label: entry.label ?? entry.name },
		]),
	),
);

function zip(arrays: Array<Array<IntervalFrequencyPoint | FrequencyPoint>>) {
	return arrays[0]?.map((_, i) => {
		return arrays.map((array) => {
			return array[i];
		});
	});
}
const chartData = computed(() => zip(props.series.map((e) => e.data)));
type Data = SeriesData["data"][number];
const tickFormat = (tick: number) => {
	return chartData.value?.[tick]?.[0]?.[0] ?? 0;
};
const yAccessors = computed(() => props.series.map((_, i) => (d: Array<Data>) => d[i]?.[1] ?? 0));
const color = computed(() => props.series.map((s) => s.color));

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

function svgPointToScreen(ptEl: SVGGraphicsElement): { x: number; y: number } | null {
	const ctm = ptEl.getScreenCTM();
	if (!ctm) return null;
	const origin = ptEl.ownerSVGElement!.createSVGPoint();
	const screen = origin.matrixTransform(ctm);
	return { x: screen.x, y: screen.y };
}

function updateSnapPoint(event: MouseEvent, seriesIdx: number) {
	const svg = lastSvg ?? containerRef.value?.querySelector<SVGSVGElement>("svg");
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
	if (!snapPoint.value) return [] as Array<[string, number]>;
	return (chartData.value?.[snapPoint.value.dataIdx] ?? []) as Array<[string, number]>;
});

function applyBarHoverOpacity(activeIdx: number | null) {
	const svg = lastSvg ?? containerRef.value?.querySelector<SVGSVGElement>("svg");
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
	const svg = lastSvg ?? containerRef.value?.querySelector<SVGSVGElement>("svg");
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

function applySeriesHoverOpacity(activeIdx: number | null) {
	if (props.chartType === "bar") applyBarHoverOpacity(activeIdx);
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
		) as Array<[string, number]>;
		const vnode = h(ChartTooltipContent, { payload: data, config: chartConfig.value, x });
		const div = document.createElement("div");
		render(vnode, div);
		return div.innerHTML;
	},
	[StackedBar.selectors.bar]: (_data: unknown, x: number) => {
		const data = (
			_data && typeof _data === "object" && "data" in _data ? _data.data : _data
		) as Array<[string, number]>;
		const vnode = h(ChartTooltipContent, { payload: data, config: chartConfig.value, x });
		const div = document.createElement("div");
		render(vnode, div);
		return div.innerHTML;
	},
}));

const minTicks = computed(() => {
	return Math.min(15, chartData.value?.length ?? 0);
});

const seriesLabels = computed(() => props.series.map((s) => String(s.label ?? s.name ?? "")));
const { exportCsv, exportSvg } = useChartExport(
	containerRef,
	chartData,
	seriesLabels,
	toRef(() => props.title),
	toRef(() => props.xAxis),
);

const attributes = {
	[VisAxisSelectors.grid]: {
		"clip-path": "inset(50px 0 0 0)",
	},
};
</script>

<template>
	<div ref="containerRef" class="relative">
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
				<DropdownMenuItem @click="exportCsv">Export CSV</DropdownMenuItem>
				<DropdownMenuItem @click="exportSvg">Export SVG</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
		<ChartContainer
			v-if="series.length > 0"
			class="aspect-auto h-fit min-h-[200px] w-full"
			:config="chartConfig"
		>
			<VisXYContainer :data="chartData" :height="height" :padding="{ top: 50 }">
				<VisAnnotations v-if="title" :items="titleAnnotation"></VisAnnotations>
				<VisAxis
					:full-size="false"
					:grid-line="false"
					:label="xAxis"
					:num-ticks="minTicks"
					:tick-format="tickFormat"
					:tick-text-hide-overlapping="orientation === 'vertical'"
					:tick-values="
						minTicks <= 3 || orientation === 'horizontal'
							? chartData?.map((_, idx) => idx)
							: undefined
					"
					:type="orientation === 'vertical' ? 'x' : 'y'"
				></VisAxis>
				<VisAxis
					:attributes="orientation !== 'vertical' ? attributes : null"
					:full-size="false"
					:label="yAxis"
					:type="orientation === 'vertical' ? 'y' : 'x'"
				></VisAxis>
				<VisGroupedBar
					v-if="chartType === 'bar'"
					:bar-padding="0.25"
					:color="color"
					:events="barEvents"
					:group-padding="0.2"
					:orientation="orientation"
					:rounded-corners="3"
					:x="(_d: Data[], idx: number) => idx"
					:y="yAccessors"
				/>
				<VisStackedBar
					v-if="chartType === 'stack'"
					:bar-padding="0.25"
					:color="color"
					:events="barEvents"
					:group-padding="0.2"
					:orientation="orientation"
					:rounded-corners="3"
					:x="(_d: Data[], idx: number) => idx"
					:y="yAccessors"
				/>
				<template v-if="chartType === 'line'">
					<VisLine
						:color="color"
						:events="lineEvents"
						:x="(_d: Data[], idx: number) => idx"
						:y="yAccessors"
					/>
					<VisScatter
						:color="color"
						:events="scatterEvents"
						:size="8"
						:x="(_d: Data[], idx: number) => idx"
						:y="yAccessors"
					/>
				</template>

				<VisTooltip :follow-cursor="false" :triggers="triggers"></VisTooltip>
			</VisXYContainer>
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
				<ChartTooltipContent :config="chartConfig" :payload="snapTooltipPayload" />
			</div>
		</template>
	</div>
</template>
