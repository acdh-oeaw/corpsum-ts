<script setup lang="ts">
import cloud from "d3-cloud";
import { Maximize2, MoreHorizontal } from "lucide-vue-next";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface CloudWord {
	label: string;
	fontSize: number;
	fill: string;
	weight: number;
	freq?: number;
	collFreq?: number;
	d?: number;
	m?: number;
	t?: number;
	// set by d3-cloud after layout:
	x: number;
	y: number;
	size: number;
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
	{ height: 420 },
);

const hoveredWord = ref<CloudWord | null>(null);
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
	return { min: Math.min(...weights), max: Math.max(...weights) };
});

const inputWords = computed(() =>
	wordsWithWeight.value.map((word) => ({
		label: word.word,
		fontSize: clamp(
			Math.round(scaleValue(word.weight, weightRange.value.min, weightRange.value.max, 12, 48)),
			12,
			48,
		),
		fill: props.color,
		weight: word.weight,
		freq: word.freq,
		collFreq: word.coll_freq,
		d: word.d,
		m: word.m,
		t: word.t,
	})),
);

const containerRef = useTemplateRef("containerRef");
const layoutedWords = ref<Array<CloudWord>>([]);
const containerWidth = ref(0);
let computePending = false;

async function computeCloud() {
	computePending = true;
	await document.fonts.ready;
	const width = containerRef.value?.clientWidth ?? 0;
	containerWidth.value = width;
	cloud<CloudWord>()
		.size([width, props.height])
		.words(inputWords.value.map((n) => ({ ...n, x: 0, y: 0, size: n.fontSize })))
		.padding(20)
		.rotate(() => 0)
		.spiral("rectangular")
		.font("Inter, sans-serif")
		.fontSize((d) => d.fontSize)
		.fontWeight(() => 800)
		.text((d) => d.label)
		.on("end", (computed) => {
			computePending = false;
			layoutedWords.value = computed;
		})
		.random(() => 0.5)
		.start();
}

function handleFullscreenChange() {
	if (!document.fullscreenElement) {
		layoutedWords.value = [];
		requestAnimationFrame(() => {
			void computeCloud();
		});
	}
}

watchEffect((onCleanup) => {
	const el = containerRef.value;
	if (!el) return;

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	const observer = new ResizeObserver(() => {
		if (debounceTimer !== null) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			debounceTimer = null;
			if (computePending) return;
			void computeCloud();
		}, 60);
	});
	observer.observe(el);

	onCleanup(() => {
		observer.disconnect();
		if (debounceTimer !== null) clearTimeout(debounceTimer);
	});
});

function onWordEnter(word: CloudWord, e: MouseEvent) {
	hoveredWord.value = word;
	pointer.value = { x: e.pageX - 32, y: e.pageY };
}

function onWordFocus(word: CloudWord, e: FocusEvent) {
	hoveredWord.value = word;
	const rect = (e.currentTarget as Element).getBoundingClientRect();
	pointer.value = { x: rect.left + window.scrollX, y: rect.bottom + window.scrollY };
}

function openFullscreen() {
	void containerRef.value?.requestFullscreen();
}

const t = useTranslations();

const wordTableData = computed(() =>
	props.words.length > 0
		? {
				headers: ["Word", "Weight", "Frequency", "Collocational Frequency", "D", "M", "T"],
				rows: props.words.map((w) => [w.word, w.weight, w.freq, w.coll_freq, w.d, w.m, w.t]),
			}
		: undefined,
);

const { exportCsv, exportXlsx, exportSvg, exportPng, exportJpg } = useChartExport(
	containerRef,
	wordTableData,
	ref([]),
	toRef(() => props.title),
	ref(undefined),
);
</script>

<template>
	<div class="space-y-3">
		<div class="relative space-y-1">
			<h3 class="text-base font-semibold">{{ title }}</h3>
			<p class="text-sm text-muted-foreground">{{ queryLabel }}</p>
			<DropdownMenu v-if="layoutedWords.length > 0" class="ml-auto">
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
		</div>

		<div
			ref="containerRef"
			class="overflow-hidden [&:fullscreen]:bg-white"
			@fullscreenchange="handleFullscreenChange"
		>
			<div
				v-if="layoutedWords.length > 0"
				:aria-label="title"
				tabindex="0"
				@focusout="hoveredWord = null"
			>
				<svg :height="height" role="img" style="display: block" :width="containerWidth">
					<g :transform="`translate(${containerWidth / 2}, ${height / 2})`">
						<g
							v-for="word in layoutedWords"
							:key="word.label"
							:aria-label="`${word.label}, weight ${word.weight}, frequency ${word.freq}`"
							:aria-selected="hoveredWord?.label === word.label"
							role="option"
							tabindex="-1"
							:transform="`translate(${word.x}, ${word.y})`"
							@blur="hoveredWord = null"
							@focus="onWordFocus(word, $event)"
							@mouseleave="hoveredWord = null"
							@mousemove="onWordEnter(word, $event)"
						>
							<text
								:fill="color"
								font-family="Inter, sans-serif"
								:font-size="`${word.fontSize}px`"
								font-weight="800"
								style="cursor: default; user-select: none"
								text-anchor="middle"
							>
								{{ word.label }}
							</text>
						</g>
					</g>
				</svg>
			</div>

			<div
				v-if="hoveredWord"
				class="pointer-events-none absolute z-10 max-w-64 rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur"
				:style="{ left: `${pointer.x}px`, top: `${pointer.y}px` }"
			>
				<p class="font-semibold">{{ hoveredWord.label }}</p>
				<p>Frequency: {{ hoveredWord.freq }}</p>
				<p>Collocational Frequency: {{ hoveredWord.collFreq }}</p>
				<p>D: {{ hoveredWord.d }}</p>
				<p>M: {{ hoveredWord.m }}</p>
				<p>T: {{ hoveredWord.t }}</p>
			</div>
		</div>
	</div>
</template>
