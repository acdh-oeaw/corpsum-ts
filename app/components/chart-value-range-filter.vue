<script setup lang="ts">
import { computed, watch } from "vue";

import { useTranslations } from "@/composables/use-translations";

import { Slider } from "./ui/slider";

const props = defineProps<{ values: Array<number> }>();
const range = defineModel<[number, number] | undefined>({ required: true });
const t = useTranslations();
const bounds = computed<[number, number]>(() => {
	return props.values.length > 0 ? [Math.min(...props.values), Math.max(...props.values)] : [0, 0];
});
const step = computed(() => Math.max((bounds.value[1] - bounds.value[0]) / 100, 0.000001));
const locale = useLocale();
const formatValue = (value: number) =>
	value.toLocaleString(locale.value, { maximumFractionDigits: 5 });

const selectedRange = computed({
	get: () => range.value ?? bounds.value,
	set: (value: [number, number]) => (range.value = value),
});
watch(bounds, (value) => (range.value = [...value]), { immediate: true });
</script>

<template>
	<div
		v-if="bounds[0] < bounds[1]"
		class="inline-flex h-8 items-center gap-2 rounded-md border bg-background px-2"
	>
		<span class="whitespace-nowrap text-xs text-muted-foreground">{{ t("Chart.valueRange") }}</span>
		<Slider
			v-model="selectedRange"
			class="w-28 px-2"
			:aria-label="t('Chart.valueRange')"
			:min="bounds[0]"
			:max="bounds[1]"
			:step="step"
		/>
		<span class="whitespace-nowrap text-xs tabular-nums text-muted-foreground" aria-live="polite">
			{{ formatValue(selectedRange[0]) }}–{{ formatValue(selectedRange[1]) }}
		</span>
	</div>
</template>
