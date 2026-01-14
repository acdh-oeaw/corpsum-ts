<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { DialogDescription, type DialogDescriptionProps, useForwardProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/lib/utils";

const props = defineProps<DialogDescriptionProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<DialogDescription
		v-bind="forwardedProps"
		:class="cn('text-sm text-muted-foreground', props.class)"
	>
		<slot />
	</DialogDescription>
</template>
