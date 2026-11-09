<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { ToolbarButton, type ToolbarButtonProps, useForwardProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { type ButtonVariants, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const props = withDefaults(
	defineProps<
		ToolbarButtonProps & {
			"aria-label"?: string;
			nativeTooltip?: boolean;
			class?: HTMLAttributes["class"];
			variant?: ButtonVariants["variant"];
			size?: ButtonVariants["size"];
		}
	>(),
	{
		nativeTooltip: true,
		size: "sm",
		variant: "ghost",
	},
);

const delegatedProps = reactiveOmit(props, "class", "size", "variant", "nativeTooltip");
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<ToolbarButton
		v-bind="forwardedProps"
		:title="props.nativeTooltip !== false ? props['aria-label'] : undefined"
		:class="cn(buttonVariants({ variant, size }), props.class)"
	>
		<slot />
	</ToolbarButton>
</template>
