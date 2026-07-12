<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { ToolbarRoot, type ToolbarRootProps, useForwardProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/lib/utils";

const props = defineProps<
	ToolbarRootProps & {
		class?: HTMLAttributes["class"];
	}
>();

const delegatedProps = reactiveOmit(props, "class");
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<ToolbarRoot
		v-bind="forwardedProps"
		:class="
			cn(
				'flex min-w-0 flex-wrap items-center gap-2 rounded-md border bg-background p-2',
				props.class,
			)
		"
	>
		<slot />
	</ToolbarRoot>
</template>
