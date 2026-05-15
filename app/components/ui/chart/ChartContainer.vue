<script lang="ts">
import { useId } from "reka-ui";
import { computed, type HTMLAttributes, toRefs } from "vue";

import { cn } from "@/lib/utils";

import { type ChartConfig, provideChartContext } from ".";
import ChartStyle from "./ChartStyle.vue";
</script>

<script setup lang="ts">
const props = defineProps<{
	id?: HTMLAttributes["id"];
	class?: HTMLAttributes["class"];
	config: ChartConfig;
	cursor?: boolean;
}>();

defineSlots<{
	default: {
		id: string;
		config: ChartConfig;
	};
}>();

const { config } = toRefs(props);
const uniqueId = useId();
const chartId = computed(() => `chart-${props.id || uniqueId.replace(/:/g, "")}`);

provideChartContext({
	id: uniqueId,
	config,
});
</script>

<template>
	<div
		:class="
			cn(
				`[&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden flex aspect-video size-full flex-col justify-center text-xs [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.tick_line]:!stroke-border/50 [&_.tick_text]:!fill-muted-foreground [&_[data-vis-single-container]]:size-full [&_[data-vis-xy-container]]:size-full `,
				props.class,
			)
		"
		:data-chart="chartId"
		data-slot="chart"
		:style="{
			'--vis-tooltip-padding': '0px',
			'--vis-tooltip-background-color': 'transparent',
			'--vis-tooltip-border-color': 'transparent',
			'--vis-tooltip-text-color': 'none',
			'--vis-tooltip-shadow-color': 'none',
			'--vis-tooltip-backdrop-filter': 'none',
			'--vis-crosshair-circle-stroke-color': '#0000',
			'--vis-crosshair-line-stroke-width': cursor ? '1px' : '0px',
			'--vis-font-family': 'var(--font-sans)',
		}"
	>
		<slot :id="uniqueId" :config="config" />
		<ChartStyle :id="chartId" />
	</div>
</template>
