<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import type { VariantProps } from "class-variance-authority";
import {
	ToolbarToggleGroup,
	type ToolbarToggleGroupEmits,
	type ToolbarToggleGroupProps,
	useForwardPropsEmits,
} from "reka-ui";
import { type HTMLAttributes, provide } from "vue";

import type { toggleVariants } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

type ToolbarToggleGroupVariants = VariantProps<typeof toggleVariants>;

const props = defineProps<
	ToolbarToggleGroupProps & {
		class?: HTMLAttributes["class"];
		variant?: ToolbarToggleGroupVariants["variant"];
		size?: ToolbarToggleGroupVariants["size"];
	}
>();
const emits = defineEmits<ToolbarToggleGroupEmits>();

provide("toolbarToggleGroup", {
	variant: props.variant,
	size: props.size,
});

const delegatedProps = reactiveOmit(props, "class");
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<ToolbarToggleGroup
		v-slot="slotProps"
		v-bind="forwarded"
		:class="cn('inline-flex items-center justify-center gap-0.5 rounded-md', props.class)"
	>
		<slot v-bind="slotProps" />
	</ToolbarToggleGroup>
</template>
