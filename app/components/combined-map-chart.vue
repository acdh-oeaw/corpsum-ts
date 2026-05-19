<script setup lang="ts">
import turfCentroid from "@turf/centroid";
import { toWgs84 } from "@turf/projection";
import { ref, watch } from "vue";

import type { PieSliceData, TooltipData } from "@/components/map.vue";
import { mapAustria } from "@/utils/map-austria";
import { hexToRgb, MAP_USED_REGIONS } from "@/utils/map-colors";

const props = defineProps<{
	queries: Array<CorpusQuery>;
	resdata: Array<RegionalFrequency>;
	mode: string;
}>();

const t = useTranslations();

const usedRegions = MAP_USED_REGIONS;

const PIE_RADIUS_DEG = 0.25;
const PIE_SEGMENTS = 32;

const mapAustriaWgs84Features = mapAustria.features.map((f) => toWgs84(f));

const wgs84Centroids = mapAustriaWgs84Features
	.filter((f) => usedRegions.includes(String(f.properties?.["hc-key"] ?? "")))
	.map((f) => {
		const center = turfCentroid(f as Parameters<typeof turfCentroid>[0]);
		return {
			key: String(f.properties?.["hc-key"] ?? ""),
			name: String(f.properties?.["name"] ?? ""),
			position: center.geometry.coordinates as [number, number],
		};
	});

const currentRegionData = ref(new Map<string, { values: number[]; winnerIndex: number }>());

function buildRegionData(): Map<string, { values: number[]; winnerIndex: number }> {
	const map = new Map<string, { values: number[]; winnerIndex: number }>();

	for (const region of usedRegions) {
		map.set(region, {
			values: new Array(props.queries.length).fill(0) as number[],
			winnerIndex: 0,
		});
	}

	for (const rdata of props.resdata) {
		const queryIdx = props.queries.findIndex((q) => q.id === rdata.query);
		if (queryIdx === -1) continue;

		for (const d of rdata.data) {
			const entry = map.get(d.region);
			if (!entry) continue;
			entry.values[queryIdx] = props.mode === "relative" ? d.relative : d.absolute;
		}
	}

	for (const entry of map.values()) {
		let maxVal = 0;
		let maxIdx = -1;
		entry.values.forEach((v, i) => {
			if (v > maxVal) {
				maxVal = v;
				maxIdx = i;
			}
		});
		entry.winnerIndex = maxIdx;
	}

	return map;
}

function getFillColor(feature: {
	properties?: Record<string, unknown>;
}): [number, number, number, number] {
	const key = String(feature.properties?.["hc-key"] ?? "");
	const entry = currentRegionData.value.get(key);
	if (!entry || props.queries.length === 0) return [220, 220, 220, 255];
	const winner = props.queries[entry.winnerIndex];
	if (!winner) return [220, 220, 220, 255];
	const [r, g, b] = hexToRgb(winner.color);
	return [r, g, b, 200];
}

function getTooltip(feature: { properties?: Record<string, unknown> }): TooltipData | null {
	if (!feature.properties) return null;
	const key = String(feature.properties["hc-key"] ?? "");
	const name = String(feature.properties["name"] ?? key);
	const entry = currentRegionData.value.get(key);
	if (!entry) return null;

	const sorted = props.queries
		.map((q, i) => ({ label: q.userInput, color: q.color, value: entry.values[i] ?? 0 }))
		.sort((a, b) => b.value - a.value);

	return {
		x: name,
		payload: sorted.map((q) => [q.label, q.value]),
		config: Object.fromEntries(
			sorted.map((q, i) => [String(i), { label: q.label, color: q.color }]),
		),
	};
}

const pieSlices = ref<PieSliceData[]>([]);

function computePieSlices(): PieSliceData[] {
	const result: PieSliceData[] = [];
	if (props.queries.length <= 1) return result;

	for (const centroid of wgs84Centroids) {
		const entry = currentRegionData.value.get(centroid.key);
		if (!entry) continue;

		const total = entry.values.reduce((s, v) => s + v, 0);
		if (total === 0) continue;

		const [cx, cy] = centroid.position;
		const cosLat = Math.cos((cy * Math.PI) / 180);

		let startAngle = -Math.PI / 2;

		for (let i = 0; i < props.queries.length; i++) {
			const query = props.queries[i];
			if (!query) continue;
			const value = entry.values[i] ?? 0;
			if (value <= 0) continue;

			const tooltipData: TooltipData = {
				x: centroid.name,
				payload: [[query.userInput, value]],
				config: { "0": { label: query.userInput, color: query.color } },
			};

			const angle = (value / total) * 2 * Math.PI;
			const numSteps = Math.max(2, Math.ceil((angle / (2 * Math.PI)) * PIE_SEGMENTS));
			const polygon: [number, number][] = [[cx, cy]];

			for (let step = 0; step <= numSteps; step++) {
				const a = startAngle + (angle * step) / numSteps;
				polygon.push([
					cx + (PIE_RADIUS_DEG / cosLat) * Math.cos(a),
					cy + PIE_RADIUS_DEG * Math.sin(a),
				]);
			}

			const [r, g, b] = hexToRgb(query.color);
			result.push({ polygon, fillColor: [r, g, b, 255], tooltipData });

			startAngle += angle;
		}
	}

	return result;
}

function rebuild() {
	currentRegionData.value = buildRegionData();
	pieSlices.value = computePieSlices();
}

rebuild();

watch(
	() => [props.resdata, props.mode, props.queries] as const,
	() => {
		rebuild();
	},
	{ deep: true },
);
</script>

<template>
	<div class="space-y-3">
		<h3 class="text-sm font-medium">{{ t("all-queries-in-one-chart") }}</h3>

		<div class="flex flex-wrap gap-3">
			<div v-for="query in queries" :key="query.id" class="flex items-center gap-1.5 text-xs">
				<span
					class="inline-block h-3 w-3 shrink-0 rounded-sm"
					:style="{ backgroundColor: query.color }"
				/>
				{{ query.userInput }}
			</div>
		</div>

		<Map
			:get-fill-color="getFillColor"
			:get-tooltip="getTooltip"
			:pie-slices="pieSlices.length > 0 ? pieSlices : undefined"
			:update-triggers="[mode, resdata, queries]"
			:used-regions="usedRegions"
		/>
	</div>
</template>
