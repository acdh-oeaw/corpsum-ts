<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import type { VariantProps } from "class-variance-authority";
import { ToggleGroupItem, type ToggleGroupItemProps, useForwardProps } from "reka-ui";
import { computed, type HTMLAttributes, inject } from "vue";

import { toggleVariants } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

type ToggleGroupVariants = VariantProps<typeof toggleVariants>;

const props = defineProps<
	ToggleGroupItemProps & {
		class?: HTMLAttributes["class"];
		variant?: ToggleGroupVariants["variant"];
		size?: ToggleGroupVariants["size"];
	}
>();

const context = inject<{
	variant?: ToggleGroupVariants["variant"];
	size?: ToggleGroupVariants["size"];
}>("toggleGroup", {});

const delegatedProps = reactiveOmit(props, "class", "size", "variant");
const forwardedProps = useForwardProps(delegatedProps);

const variant = computed(() => props.variant ?? context.variant);
const size = computed(() => props.size ?? context.size);
</script>

<template>
	<ToggleGroupItem
		v-bind="forwardedProps"
		:class="cn(toggleVariants({ variant, size }), props.class)"
	>
		<slot />
	</ToggleGroupItem>
</template>
