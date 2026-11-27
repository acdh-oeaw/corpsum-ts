<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import type { SliderRootEmits, SliderRootProps } from "reka-ui";
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from "reka-ui";
import { type HTMLAttributes } from "vue";

import { cn } from "@/lib/utils";

const props = defineProps<SliderRootProps & { class?: HTMLAttributes["class"] }>();
const emits = defineEmits<SliderRootEmits>();
const delegatedProps = reactiveOmit(props, "class");
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<SliderRoot
		v-slot="{ modelValue }"
		v-bind="forwarded"
		:class="cn('relative flex w-full touch-none select-none items-center', props.class)"
	>
		<SliderTrack class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
			<SliderRange class="absolute h-full bg-primary" />
		</SliderTrack>
		<SliderThumb
			v-for="(_, index) in modelValue"
			:key="index"
			class="block size-4 rounded-full border border-primary bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
		/>
	</SliderRoot>
</template>
