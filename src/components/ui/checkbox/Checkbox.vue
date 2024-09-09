<script setup lang="ts">
import { CheckIcon } from "@radix-icons/vue";
import {
	CheckboxIndicator,
	CheckboxRoot,
	type CheckboxRootEmits,
	type CheckboxRootProps,
	useForwardPropsEmits,
} from "radix-vue";
import { computed, type HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes["class"] }>();
const emits = defineEmits<CheckboxRootEmits>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<CheckboxRoot
		v-bind="forwarded"
		:class="
			cn(
				'border-primary focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground peer size-4 shrink-0 rounded-sm border shadow focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
				props.class,
			)
		"
	>
		<CheckboxIndicator class="flex size-full items-center justify-center text-current">
			<slot>
				<CheckIcon class="size-4" />
			</slot>
		</CheckboxIndicator>
	</CheckboxRoot>
</template>
