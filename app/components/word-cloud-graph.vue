<script setup lang="ts">
import { VisGraph, VisGraphSelectors, VisSingleContainer } from "@unovis/vue";
import cloud from "d3-cloud";

interface WordCloudNode {
	id: string;
	label: string;
	subLabel?: string;
	size: number;
	fontSize: number;
	fill: string;
	stroke: string;
	weight: number;
	freq?: number;
	collFreq?: number;
	d?: number;
	m?: number;
	t?: number;
}

const props = withDefaults(
	defineProps<{
		title: string;
		queryLabel: string;
		color: string;
		words: Array<{
			word: string;
			weight: number;
			freq: number;
			coll_freq: number;
			d: number;
			m: number;
			t: number;
		}>;
		height?: number;
	}>(),
	{
		height: 420,
	},
);

const hoveredNode = ref<WordCloudNode | null>(null);
const pointer = ref({ x: 0, y: 0 });

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function scaleValue(value: number, min: number, max: number, outMin: number, outMax: number) {
	if (min === max) return (outMin + outMax) / 2;
	return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}

const wordsWithWeight = computed(() =>
	props.words
		.filter((word) => Number.isFinite(word.weight) && word.weight > 0)
		.sort((a, b) => b.weight - a.weight),
);

const weightRange = computed(() => {
	const weights = wordsWithWeight.value.map((word) => word.weight);
	return {
		min: Math.min(...weights),
		max: Math.max(...weights),
	};
});

const graphData = computed(() => {
	return [
		...wordsWithWeight.value.map((word) => ({
			id: word.word,
			label: word.word,
			subLabel: `${Math.round(word.weight * 100) / 100}`,
			fontSize: clamp(
				Math.round(scaleValue(word.weight, weightRange.value.min, weightRange.value.max, 8, 48)),
				8,
				48,
			),
			fill: props.color,
			stroke: props.color,
			weight: word.weight,
			freq: word.freq,
			collFreq: word.coll_freq,
			d: word.d,
			m: word.m,
			t: word.t,
		})),
	];
});

const events = {
	[VisGraphSelectors.node]: {
		mousemove: (node: WordCloudNode, event: MouseEvent) => {
			hoveredNode.value = node;
			pointer.value = { x: event.offsetX + 16, y: event.offsetY + 16 };
		},
		mouseleave: () => {
			hoveredNode.value = null;
		},
	},
};

const containerRef = useTemplateRef("containerRef");
const zoomScaleExtent: [number, number] = [0.8, 2.5];
const attributes = computed(() => ({
	[VisGraphSelectors.node]: {
		"font-size": (node: LayoutedWord) => `${node.fontSize}px`,
		"font-weight": 800,
		fill: props.color,
		"text-anchor": "middle",
	},
}));

function getNodeShape(node: LayoutedWord) {
	return `<text fill="${node.fill}">${node.label}</text>`;
}
type LayoutedWord = WordCloudNode & {
	x: number;
	y: number;
	size: number;
};
const layoutedWords = ref<Array<LayoutedWord>>([]);
onMounted(() => {
	cloud<LayoutedWord>()
		.size([1.2 * (containerRef.value?.clientWidth ?? 0), props.height])
		.words(graphData.value.map((n) => ({ ...n, x: 0, y: 0, size: n.fontSize })))
		.padding(20)
		.rotate(() => 0)
		.spiral("rectangular")
		.font("Inter, sans-serif")
		.fontSize((d) => d.fontSize)
		.fontWeight((_) => 800)
		.text((d) => d.label)
		.on("end", (computedWords) => {
			layoutedWords.value = computedWords;
		})
		.random(() => 0.5)
		.start();
});

const nodes = computed(() =>
	layoutedWords.value.map((w, i) => ({
		...w,
		id: i,
	})),
);
const nodeX = (d: LayoutedWord) => d.x;
const nodeY = (d: LayoutedWord) => d.y;

const emptyLinks: Array<never> = [];
const containerData = computed(() => ({ nodes: nodes.value, links: emptyLinks }));
</script>

<template>
	<div ref="containerRef" class="space-y-3">
		<div class="space-y-1">
			<h3 class="text-base font-semibold">{{ title }}</h3>
			<p class="text-sm text-muted-foreground">{{ queryLabel }}</p>
		</div>

		<div class="relative overflow-hidden">
			<VisSingleContainer
				v-if="layoutedWords && layoutedWords.length > 0"
				class="min-h-[320px] w-full"
				:data="containerData"
				:style="{
					height: `${height}px`,
				}"
			>
				<VisGraph
					:attributes="attributes"
					:disable-brush="true"
					:disable-drag="true"
					:duration="300"
					:events="events"
					layout-type="precalculated"
					:node-label="undefined"
					:node-shape="getNodeShape"
					:node-stroke-width="0"
					:node-x="nodeX"
					:node-y="nodeY"
					:zoom-scale-extent="zoomScaleExtent"
				/>
			</VisSingleContainer>

			<div
				v-if="hoveredNode"
				class="pointer-events-none absolute z-10 max-w-64 rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur"
				:style="{
					left: `${pointer.x}px`,
					top: `${pointer.y}px`,
				}"
			>
				<p class="font-semibold">{{ hoveredNode.label }}</p>

				<p>Frequency: {{ hoveredNode.freq }}</p>
				<p>Collocational Frequency: {{ hoveredNode.collFreq }}</p>
				<p>D: {{ hoveredNode.d }}</p>
				<p>M: {{ hoveredNode.m }}</p>
				<p>T: {{ hoveredNode.t }}</p>
			</div>
		</div>
	</div>
</template>
