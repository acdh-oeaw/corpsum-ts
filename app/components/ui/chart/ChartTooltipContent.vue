<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";

import { cn } from "@/lib/utils";

import type { ChartConfig } from ".";

type DataPoint = [label: string | number, value: number];

const props = withDefaults(
	defineProps<{
		payload?: Array<DataPoint>;
		config?: ChartConfig;
		class?: HTMLAttributes["class"];
		x?: number | Date | string;
		percent?: boolean;
	}>(),
	{
		payload: () => [],
		config: () => ({}),
	},
);

const yearRange = computed(() => {
	const first = props.payload[0];
	return Array.isArray(first) ? first[0] : "";
});

const title = computed(() => props.x ?? yearRange.value);

const rows = computed(() =>
	Object.entries(props.config).map(([, entry], i) => {
		const point = props.payload[i];
		const value = Array.isArray(point) ? point[1] : undefined;
		return {
			label: (entry.label as string) ?? "",
			color: entry.color ?? "currentColor",
			value,
		};
	}),
);
const currentLocale = useLocale();
function asPercent(val: number) {
	return `${(val * 100).toFixed(2)}%`;
}
</script>

<template>
	<div
		:class="
			cn(
				'grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
				props.class,
			)
		"
	>
		<div v-if="title" class="font-medium">{{ title }}</div>
		<div class="grid gap-1.5">
			<div
				v-for="{ label, color, value } in rows"
				:key="label"
				class="flex w-full items-center gap-2"
			>
				<span class="size-2 shrink-0 rounded-full" :style="{ background: color }" />
				<span class="text-muted-foreground">{{ label }}</span>
				<span v-if="value != null" class="ml-auto pl-4 font-medium tabular-nums text-foreground">
					{{ props.percent ? asPercent(value!) : value.toLocaleString(currentLocale) }}
				</span>
			</div>
		</div>
	</div>
</template>
