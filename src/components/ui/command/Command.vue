<script setup lang="ts">
import {
	ComboboxRoot,
	type ComboboxRootEmits,
	type ComboboxRootProps,
	useForwardPropsEmits,
} from "radix-vue";
import { computed, type HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = withDefaults(defineProps<ComboboxRootProps & { class?: HTMLAttributes["class"] }>(), {
	open: true,
	modelValue: "",
});

const emits = defineEmits<ComboboxRootEmits>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<ComboboxRoot
		v-bind="forwarded"
		:class="
			cn(
				'bg-popover text-popover-foreground flex size-full flex-col overflow-hidden rounded-md',
				props.class,
			)
		"
	>
		<slot />
	</ComboboxRoot>
</template>
