<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { Check } from "lucide-vue-next";
import {
	CheckboxIndicator,
	CheckboxRoot,
	type CheckboxRootEmits,
	type CheckboxRootProps,
	useForwardPropsEmits,
} from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/lib/utils";

const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes["class"] }>();
const emits = defineEmits<CheckboxRootEmits>();

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<CheckboxRoot
		v-bind="forwarded"
		:class="
			cn(
				'peer grid size-4 shrink-0 place-content-center rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
				props.class,
			)
		"
	>
		<CheckboxIndicator class="grid place-content-center text-current">
			<slot>
				<Check class="size-4" />
			</slot>
		</CheckboxIndicator>
	</CheckboxRoot>
</template>
