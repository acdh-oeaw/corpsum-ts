<script setup lang="ts">
import { computed, type HTMLAttributes, onMounted, ref } from "vue";

import { cn } from "@/lib/utils";

import { useChart } from ".";

const props = withDefaults(
	defineProps<{
		hideIcon?: boolean;
		nameKey?: string;
		verticalAlign?: "bottom" | "top";
		// payload?: any[]
		class?: HTMLAttributes["class"];
	}>(),
	{
		verticalAlign: "bottom",
	},
);

const emit = defineEmits<{
	(e: "series-hover", idx: number): void;
	(e: "series-leave"): void;
}>();

const { id, config } = useChart();

const payload = computed(() =>
	Object.entries(config.value).map(([key, _value]) => {
		return {
			key: props.nameKey || key,
			itemConfig: config.value[key],
		};
	}),
);

const containerSelector = ref("");
onMounted(() => {
	containerSelector.value = `[data-chart="chart-${id}"]>[data-vis-xy-container]`;
});
</script>

<template>
	<div
		v-if="containerSelector"
		:class="
			cn(
				'flex items-center justify-center gap-4',
				verticalAlign === 'top' ? 'pb-3' : 'pt-3',
				props.class,
			)
		"
	>
		<button
			v-for="({ key, itemConfig }, idx) in payload"
			:key="key"
			:class="
				cn('flex cursor-pointer items-center gap-1.5 [&>svg]:size-3 [&>svg]:text-muted-foreground')
			"
			type="button"
			@blur="emit('series-leave')"
			@focus="emit('series-hover', idx)"
			@mouseenter="emit('series-hover', idx)"
			@mouseleave="emit('series-leave')"
		>
			<component :is="itemConfig?.icon" v-if="itemConfig?.icon" />
			<div
				v-else
				class="size-2 shrink-0 rounded-[2px]"
				:style="{
					backgroundColor: itemConfig?.color,
				}"
			/>

			{{ itemConfig?.label }}
		</button>
	</div>
</template>
