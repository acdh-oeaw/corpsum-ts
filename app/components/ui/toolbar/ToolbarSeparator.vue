<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { ToolbarSeparator, type ToolbarSeparatorProps, useForwardProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/lib/utils";

const props = defineProps<
	ToolbarSeparatorProps & {
		class?: HTMLAttributes["class"];
	}
>();

const delegatedProps = reactiveOmit(props, "class");
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<ToolbarSeparator
		v-bind="forwardedProps"
		:class="cn('mx-0.5 h-6 w-px shrink-0 bg-border', props.class)"
	/>
</template>
