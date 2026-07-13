<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import type { VariantProps } from "class-variance-authority";
import { ToolbarToggleItem, type ToolbarToggleItemProps, useForwardProps } from "reka-ui";
import { computed, type HTMLAttributes, inject } from "vue";

import { toggleVariants } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

type ToolbarToggleGroupVariants = VariantProps<typeof toggleVariants>;

const props = defineProps<
	ToolbarToggleItemProps & {
		class?: HTMLAttributes["class"];
		variant?: ToolbarToggleGroupVariants["variant"];
		size?: ToolbarToggleGroupVariants["size"];
	}
>();

const context = inject<{
	variant?: ToolbarToggleGroupVariants["variant"];
	size?: ToolbarToggleGroupVariants["size"];
}>("toolbarToggleGroup", {});

const delegatedProps = reactiveOmit(props, "class", "size", "variant");
const forwardedProps = useForwardProps(delegatedProps);

const variant = computed(() => props.variant ?? context.variant);
const size = computed(() => props.size ?? context.size);
</script>

<template>
	<ToolbarToggleItem
		v-bind="forwardedProps"
		:class="cn(toggleVariants({ variant, size }), props.class)"
	>
		<slot />
	</ToolbarToggleItem>
</template>
