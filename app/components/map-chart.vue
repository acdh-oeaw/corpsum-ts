<script setup lang="ts">
import { watch } from "vue";

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
	const minColorRgb: [number, number, number] = [238, 238, 238];
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
	</div>
</template>
