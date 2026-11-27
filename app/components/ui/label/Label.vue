<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { Label, type LabelProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/lib/utils";

const props = defineProps<LabelProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
	<!-- eslint-disable-next-line vuejs-accessibility/label-has-for -->
	<Label
		v-bind="delegatedProps"
		:class="
			cn(
				'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
				props.class,
			)
		"
	>
		<slot />
	</Label>
</template>
