<script setup lang="ts">
import { computed } from "vue";

import type { TooltipData } from "@/components/map.vue";
import { mapAustria } from "@/utils/map-austria";
import { hexToRgb, linearInterpolate, logInterpolate, MAP_USED_REGIONS } from "@/utils/map-colors";

const regionNames = Object.fromEntries(
	mapAustria.features.map((f) => [String(f.properties["hc-key"]), String(f.properties["name"])]),
);

const props = withDefaults(
	defineProps<{
		query: CorpusQuery;
		resdata: Array<RegionalFreqData>;
		mode: string;
		scale?: "log" | "linear";
	}>(),
	{
		scale: "log",
	},
);

const usedRegions = MAP_USED_REGIONS;

const valueMap = computed(() => {
	const map = new Map<string, number>();
	for (const d of props.resdata) {
		if (usedRegions.includes(d.region)) {
			map.set(d.region, props.mode === "relative" ? d.relative : d.absolute);
		}
	}
	return map;
});

const maxVal = computed(() => {
	const vals = [...valueMap.value.values()];
	return Math.max(...(vals.length > 0 ? vals : [0]), 10);
});

const colors = computed(() => {
	const minColorRgb: [number, number, number] = hexToRgb("#eeeeee");
	const maxColorRgb = hexToRgb(props.query.color);
	const result: Record<string, [number, number, number, number]> = {};
	for (const region of usedRegions) {
		const value = valueMap.value.get(region) ?? 0;
		result[region] =
			props.scale === "linear"
				? linearInterpolate(value, maxVal.value, minColorRgb, maxColorRgb)
				: logInterpolate(value, maxVal.value, minColorRgb, maxColorRgb);
	}
	return result;
});

const regionData = computed(() => {
	const result: Record<string, TooltipData> = {};
	for (const region of usedRegions) {
		const value = valueMap.value.get(region) ?? 0;
		result[region] = {
			x: regionNames[region] ?? region,
			payload: [[props.query.userInput, value]],
			config: { "0": { label: props.query.userInput, color: props.query.color } },
		};
	}
	return result;
});

const legendMaxVal = computed(() => {
	const vals = props.resdata
		.filter((d) => usedRegions.includes(d.region))
		.map((d) => (props.mode === "relative" ? d.relative : d.absolute));
	return Math.round(Math.max(...(vals.length > 0 ? vals : [0]), 10));
});

const legendMidVal = computed(() => {
	const max = legendMaxVal.value;
	return props.scale === "linear" ? Math.round(max * 0.5) : Math.round(Math.pow(max + 1, 0.5) - 1);
});
const legendQuarterVal = computed(() => {
	const max = legendMaxVal.value;
	return props.scale === "linear"
		? Math.round(max * 0.25)
		: Math.round(Math.pow(max + 1, 0.25) - 1);
});
const legendThreeQuarterVal = computed(() => {
	const max = legendMaxVal.value;
	return props.scale === "linear"
		? Math.round(max * 0.75)
		: Math.round(Math.pow(max + 1, 0.75) - 1);
});

const legendGradient = computed(() => `linear-gradient(to right, #eeeeee, ${props.query.color})`);
const currentLocale = useLocale();
function formatLegendNum(n: number): string {
	return n.toLocaleString(currentLocale.value);
}
</script>

<template>
	<div class="space-y-2">
		<h3 class="text-sm font-medium">{{ query.userInput }}</h3>
		<Map :colors="colors" :region-data="regionData" :used-regions="usedRegions" />
		<div class="space-y-1 px-1 w-64 mx-auto">
			<div class="h-3 w-full rounded" :style="{ background: legendGradient }" />
			<div class="relative text-xs text-muted-foreground">
				<span class="absolute left-0 flex flex-col items-center">
					<span class="w-px h-1.5 bg-muted-foreground/50" />
					0
				</span>
				<span class="absolute left-1/4 -translate-x-1/2 flex flex-col items-center">
					<span class="w-px h-1.5 bg-muted-foreground/50" />
					{{ formatLegendNum(legendQuarterVal) }}
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
