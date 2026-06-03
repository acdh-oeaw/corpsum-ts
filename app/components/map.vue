<script setup lang="ts">
import { Deck, WebMercatorViewport } from "@deck.gl/core";
import { GeoJsonLayer, PolygonLayer, TextLayer } from "@deck.gl/layers";
import turfCentroid from "@turf/centroid";
import { toWgs84 } from "@turf/projection";
import { Maximize2, MoreHorizontal } from "lucide-vue-next";
import {
	computed,
	getCurrentInstance,
	h,
	onBeforeUnmount,
	onMounted,
	ref,
	render,
	shallowRef,
	useTemplateRef,
	watch,
} from "vue";

import type { ChartConfig } from "@/components/ui/chart";
import ChartTooltipContent from "@/components/ui/chart/ChartTooltipContent.vue";
import { useChartExport } from "@/composables/use-chart-export";
import { useTranslations } from "@/composables/use-translations";
import { mapAustria } from "@/utils/map-austria";

import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type RegionFeature = { properties?: Record<string, unknown> };

export type TooltipData = {
	payload: Array<[string, number]>;
	config: ChartConfig;
	x?: string | number | Date;
};

export type PieSliceData = {
	polygon: [number, number][];
	fillColor: [number, number, number, number];
	tooltipData: TooltipData;
};
const appContext = getCurrentInstance()?.appContext;
function renderTooltipHtml(data: TooltipData): string {
	const vnode = h(ChartTooltipContent, data);
	if (appContext) vnode.appContext = appContext;
	const div = document.createElement("div");
	render(vnode, div);
	const html = div.innerHTML;
	render(null, div);
	return html;
}

const props = withDefaults(
	defineProps<{
		colors: Record<string, [number, number, number, number]>;
		regionData?: Record<string, TooltipData>;
		height?: number | string;
		pieSlices?: PieSliceData[];
		usedRegions?: Array<string>;
	}>(),
	{
		height: 450,
		pieSlices: () => [],
		usedRegions: () => mapAustria.features.map((f) => f.properties["hc-key"]),
	},
);

const mapAustriaWgs84 = {
	type: mapAustria.type,
	features: mapAustria.features.map((f) => toWgs84(f)),
} as GeoJSON.FeatureCollection;

const containerRef = useTemplateRef("containerRef");
const canvasRef = useTemplateRef("canvasRef");
const centroidPixels = ref<Map<string, { x: number; y: number }>>(new Map());

const viewState = {
	longitude: 13.35,
	latitude: 47.7,
	zoom: 6,
	pitch: 0,
	bearing: 0,
};

const labels = computed(() =>
	mapAustriaWgs84.features
		.filter((f) => props.usedRegions.includes(String(f.properties?.["hc-key"] ?? "")))
		.map((feature) => {
			const center = turfCentroid(feature as Parameters<typeof turfCentroid>[0]);
			return {
				key: String(feature.properties?.["hc-key"] ?? ""),
				position: center.geometry.coordinates as [number, number],
				text: String(feature.properties?.["name"] ?? ""),
			};
		}),
);

const heightStyle = computed(() =>
	typeof props.height === "number" ? `${props.height}px` : props.height,
);

const deck = shallowRef<Deck | null>(null);
const resizeObserver = shallowRef<ResizeObserver | null>(null);

function buildLayers() {
	const layers: any[] = [
		new GeoJsonLayer({
			id: "choropleth",
			data: mapAustriaWgs84,
			filled: true,
			stroked: true,
			getFillColor: (feature: RegionFeature) => {
				const key = String(feature.properties?.["hc-key"] ?? "");
				return props.colors[key] ?? [200, 200, 200, 255];
			},
			getLineColor: [100, 100, 100, 255],
			getLineWidth: 1,
			lineWidthMinPixels: 1,
			pickable: true,
			autoHighlight: true,
			highlightColor: [200, 200, 200, 100],
			updateTriggers: {
				getFillColor: props.colors,
			},
		}),
	];

	if (props.pieSlices && props.pieSlices.length > 0) {
		layers.push(
			new PolygonLayer({
				id: "pie-slices",
				data: props.pieSlices,
				getPolygon: (d: PieSliceData) => d.polygon,
				getFillColor: (d: PieSliceData) => d.fillColor,
				getLineColor: [100, 100, 100, 255],
				getLineWidth: 1,
				lineWidthMinPixels: 1,
				filled: true,
				stroked: true,
				pickable: true,
				autoHighlight: true,
				highlightColor: [200, 200, 200, 100],
				updateTriggers: {
					getFillColor: props.pieSlices,
					getPolygon: props.pieSlices,
				},
			}),
		);
	} else {
		layers.push(
			new TextLayer({
				id: "labels",
				data: labels.value,
				getPosition: (d: { position: [number, number] }) => d.position,
				getText: (d: { text: string }) => d.text,
				getSize: 14,
				getColor: [50, 50, 50, 255],
				fontWeight: "bold",
				billboard: false,
				characterSet: "auto",
			}),
		);
	}

	return layers;
}

function updateCentroidPixels(width: number, height: number) {
	const viewport = new WebMercatorViewport({
		width,
		height,
		...viewState,
	});

	centroidPixels.value = new Map(
		labels.value.map((label) => {
			const [x, y] = viewport.project(label.position) as [number, number];
			return [label.key, { x, y }];
		}),
	);
}

function syncSize() {
	if (!deck.value || !containerRef.value) return;
	const width = containerRef.value.clientWidth;
	const height = containerRef.value.clientHeight;
	deck.value.setProps({ width, height });
	updateCentroidPixels(width, height);
}

function destroyDeck() {
	resizeObserver.value?.disconnect();
	resizeObserver.value = null;
	deck.value?.finalize();
	deck.value = null;
}

async function initDeck() {
	if (!canvasRef.value || !containerRef.value) return;

	destroyDeck();

	const width = containerRef.value.clientWidth || 600;
	const height = containerRef.value.clientHeight || 450;

	deck.value = new Deck({
		canvas: canvasRef.value,
		width,
		height,
		initialViewState: viewState,
		controller: false,
		layers: buildLayers() as any,
		getTooltip: ({ object }: { object?: any }) => {
			if (!object) return null;
			const data: TooltipData | null = (() => {
				if (object.tooltipData) return object.tooltipData as TooltipData;
				if (!props.regionData) return null;
				const key = String(object.properties?.["hc-key"] ?? "");
				return props.regionData[key] ?? null;
			})();
			if (!data) return null;
			return {
				html: renderTooltipHtml(data),
				style: { background: "none", border: "none", padding: "0" },
			};
		},
	});

	resizeObserver.value = new ResizeObserver(() => {
		syncSize();
	});
	resizeObserver.value.observe(containerRef.value);

	updateCentroidPixels(width, height);
}

onMounted(() => {
	void initDeck();
});

onBeforeUnmount(() => {
	destroyDeck();
});

watch(
	() => [props.colors, props.pieSlices] as const,
	() => {
		if (!deck.value) return;
		deck.value.setProps({ layers: buildLayers() as any });
	},
	{ deep: true },
);
const t = useTranslations();

const exportTableData = computed(() => {
	const entries = Object.values(props.regionData ?? {});
	if (entries.length === 0) return undefined;
	const first = entries[0]!;
	return {
		headers: ["Region", ...first.payload.map(([label]) => label)],
		rows: entries.map((d) => [String(d.x ?? ""), ...d.payload.map(([, value]) => value)]),
	};
});

const { exportCsv, exportXlsx } = useChartExport(containerRef, exportTableData, ref("map"));

function triggerDownload(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function exportPng() {
	canvasRef.value?.toBlob((blob) => {
		if (blob) triggerDownload(blob, "map.png");
	}, "image/png");
}

function exportJpg() {
	canvasRef.value?.toBlob((blob) => {
		if (blob) triggerDownload(blob, "map.jpg");
	}, "image/jpeg");
}

function openFullscreen() {
	containerRef.value?.requestFullscreen();
}
</script>

<template>
	<div ref="containerRef" class="relative [&:fullscreen]:bg-white" :style="{ height: heightStyle }">
		<DropdownMenu>
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
				<DropdownMenuItem class="text-xs" @click="exportPng">{{
					t("Chart.export.png")
				}}</DropdownMenuItem>
				<DropdownMenuItem class="text-xs" @click="exportJpg">{{
					t("Chart.export.jpg")
				}}</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
		<canvas
			ref="canvasRef"
			role="img"
			:aria-label="t('Map.label')"
			style="width: 100%; height: 100%"
		/>
	</div>
</template>
