<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { SelectGroup, type SelectGroupProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/lib/utils";

const props = defineProps<SelectGroupProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
	<SelectGroup :class="cn('w-full p-1', props.class)" v-bind="delegatedProps">
		<slot />
	</SelectGroup>
</template>
