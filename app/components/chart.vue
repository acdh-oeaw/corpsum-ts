<script setup lang="ts">
import { GroupedBar } from "@unovis/ts";
import type { LengthUnit } from "@unovis/ts/types/misc";
import {
	VisAnnotations,
	VisAxis,
	VisGroupedBar,
	VisGroupedBarSelectors,
	VisTooltip,
	VisXYContainer,
} from "@unovis/vue";
import { h, render } from "vue";

import {
	type ChartConfig,
	ChartContainer,
	ChartLegendContent,
	ChartTooltipContent,
} from "./ui/chart";

type IntervalFrequencyPoint = [yearRange: string, value: number];
type SeriesData = ChartConfig[string] & { data: Array<IntervalFrequencyPoint>; name?: string };

const props = withDefaults(
	defineProps<{
		series: Array<SeriesData>;
		chartType?: "column" | "line";
		title?: string;
		xAxis?: string;
		yAxis?: string;
	}>(),
	{
		chartType: "column",
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

function zip(arrays: Array<Array<IntervalFrequencyPoint>>) {
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

function applyHoverOpacity(activeIdx: number | null) {
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

const barEvents = {
	[VisGroupedBarSelectors.bar]: {
		mouseover: (_d: Array<Data>, event: MouseEvent) => {
			const target = event.target as SVGElement;
			lastSvg = target.closest("svg");
			const idx = Array.from(target.parentElement?.children ?? []).indexOf(target);
			applyHoverOpacity(idx);
		},
		mouseleave: () => {
			applyHoverOpacity(null);
		},
	},
	[VisGroupedBarSelectors.root]: {
		mouseleave: () => {
			applyHoverOpacity(null);
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
}));
</script>

<template>
	<div ref="containerRef">
		<ChartContainer class="min-h-[200px] w-full" :config="chartConfig">
			<VisXYContainer :data="chartData">
				<VisAnnotations v-if="title" :items="titleAnnotation"></VisAnnotations>
				<VisAxis
					:grid-line="false"
					:label="xAxis"
					:num-ticks="15"
					:tick-format="tickFormat"
					:tick-text-hide-overlapping="true"
					type="x"
				></VisAxis>
				<VisAxis :label="yAxis" type="y"></VisAxis>
				<VisGroupedBar
					:bar-padding="0.25"
					:color="color"
					:events="barEvents"
					:group-padding="0.2"
					:rounded-corners="3"
					:x="(_d: Data[], idx: number) => idx"
					:y="yAccessors"
				/>
				<VisTooltip :triggers="triggers"></VisTooltip>
			</VisXYContainer>
			<ChartLegendContent
				@series-hover="applyHoverOpacity"
				@series-leave="applyHoverOpacity(null)"
			/>
		</ChartContainer>
	</div>
</template>
