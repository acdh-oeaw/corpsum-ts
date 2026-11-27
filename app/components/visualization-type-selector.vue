<script setup lang="ts">
import {
	type VisualizationType,
	temporalFrequencyDistributionType,
	visualizationTypes,
} from "@/lib/visualization-types";

const props = defineProps<{ modelValue: Array<VisualizationType> }>();
const emit = defineEmits<{
	(event: "toggle", type: VisualizationType, checked: boolean | "indeterminate"): void;
}>();
const t = useTranslations();
const visualizationLabels: Record<
	VisualizationType,
	| "collocations"
	| "keywordInContext"
	| "mediaSources"
	| "mediaTypes"
	| "regionalFrequencies"
	| "wordFormFrequencies"
	| "yearlyFrequencies"
> = {
	"data-display-collocations": "collocations",
	"data-display-keyword-in-context": "keywordInContext",
	"data-display-media-source": "mediaSources",
	"data-display-media-type": "mediaTypes",
	"data-display-regional-frequencies": "regionalFrequencies",
	"data-display-word-form-frequencies": "wordFormFrequencies",
	[temporalFrequencyDistributionType]: "yearlyFrequencies",
};
</script>

<template>
	<div class="grid content-start gap-2 rounded-md border p-3">
		<label
			v-for="visualizationType in visualizationTypes"
			:key="visualizationType"
			class="group flex cursor-pointer items-center gap-3 overflow-hidden rounded-md border bg-card p-1.5 shadow-sm transition-colors hover:border-primary/60"
			:class="
				props.modelValue.includes(visualizationType)
					? 'border-primary ring-1 ring-primary'
					: 'border-border'
			"
		>
			<img
				:src="`/assets/images/visualization-previews/${visualizationType}.webp`"
				alt=""
				loading="lazy"
				class="aspect-video w-20 shrink-0 rounded-sm border bg-white object-cover object-top"
			/>
			<div class="flex items-center gap-2">
				<Checkbox
					:model-value="props.modelValue.includes(visualizationType)"
					@update:model-value="emit('toggle', visualizationType, $event)"
				/>
				<span class="text-xs font-medium">{{ t(visualizationLabels[visualizationType]) }}</span>
			</div>
		</label>
	</div>
</template>
