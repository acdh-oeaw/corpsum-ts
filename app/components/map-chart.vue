<script setup lang="ts">
import { computed, watch } from "vue";

import type { TooltipData } from "@/components/map.vue";
import { hexToRgb, logInterpolate, MAP_USED_REGIONS } from "@/utils/map-colors";

const props = defineProps<{
	query: CorpusQuery;
	resdata: Array<RegionalFreqData>;
	mode: string;
}>();

const usedRegions = MAP_USED_REGIONS;

let currentValueMap = new Map<string, number>();

function buildValueMap(): Map<string, number> {
	const map = new Map<string, number>();
	for (const d of props.resdata) {
		if (usedRegions.includes(d.region)) {
			map.set(d.region, props.mode === "relative" ? d.relative : d.absolute);
		}
	}
	return map;
}

function getFillColor(feature: {
	properties?: Record<string, unknown>;
}): [number, number, number, number] {
	const vals = [...currentValueMap.values()];
	const maxVal = Math.max(...(vals.length > 0 ? vals : [0]), 10);
	const minColorRgb: [number, number, number] = hexToRgb("#eeeeee");
	const maxColorRgb = hexToRgb(props.query.color);
	const key = String(feature.properties?.["hc-key"] ?? "");
	const value = currentValueMap.get(key) ?? 0;
	return logInterpolate(value, maxVal, minColorRgb, maxColorRgb);
}

function getTooltip(feature: { properties?: Record<string, unknown> }): TooltipData | null {
	if (!feature.properties) return null;
	const key = String(feature.properties["hc-key"] ?? "");
	const name = String(feature.properties["name"] ?? key);
	const value = currentValueMap.get(key) ?? 0;
	return {
		x: name,
		payload: [[props.query.userInput, value]],
		config: { "0": { label: props.query.userInput, color: props.query.color } },
	};
}

currentValueMap = buildValueMap();

watch(
	() => [props.resdata, props.mode, props.query.color] as const,
	() => {
		currentValueMap = buildValueMap();
	},
	{ deep: true },
);

const legendMaxVal = computed(() => {
	const vals = props.resdata
		.filter((d) => usedRegions.includes(d.region))
		.map((d) => (props.mode === "relative" ? d.relative : d.absolute));
	return Math.round(Math.max(...(vals.length > 0 ? vals : [0]), 10));
});

// Mid and three-quarter values on the log scale matching logInterpolate
const legendMidVal = computed(() => Math.round(Math.pow(legendMaxVal.value + 1, 0.5) - 1));
const legendThreeQuarterVal = computed(() =>
	Math.round(Math.pow(legendMaxVal.value + 1, 0.75) - 1),
);

const legendGradient = computed(() => `linear-gradient(to right, #eeeeee, ${props.query.color})`);
const currentLocale = useLocale();
function formatLegendNum(n: number): string {
	console.log(props.resdata);
	return n.toLocaleString(currentLocale.value);
}
</script>

<template>
	<div class="space-y-2">
		<h3 class="text-sm font-medium">{{ query.userInput }}</h3>
		<Map
			:get-fill-color="getFillColor"
			:get-tooltip="getTooltip"
			:update-triggers="[mode, query.color, resdata]"
			:used-regions="usedRegions"
		/>
		<div class="space-y-1 px-1 w-64 mx-auto">
			<div class="h-3 w-full rounded" :style="{ background: legendGradient }" />
			<div class="relative text-xs text-muted-foreground">
				<span class="absolute left-0 flex flex-col items-center">
					<span class="w-px h-1.5 bg-muted-foreground/50" />
					0
				</span>
				<span class="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
					<span class="w-px h-1.5 bg-muted-foreground/50" />
					{{ formatLegendNum(legendMidVal) }}
				</span>
				<span class="absolute left-3/4 -translate-x-1/2 flex flex-col items-center">
					<span class="w-px h-1.5 bg-muted-foreground/50" />
					{{ formatLegendNum(legendThreeQuarterVal) }}
				</span>
				<span class="absolute right-0 translate-x-1/2 flex flex-col items-center">
					<span class="w-px h-1.5 bg-muted-foreground/50" />
					{{ formatLegendNum(legendMaxVal) }}
				</span>
			</div>
		</div>
	</div>
</template>
