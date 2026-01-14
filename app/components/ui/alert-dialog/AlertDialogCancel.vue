<script setup lang="ts">
import { AlertDialogCancel, type AlertDialogCancelProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const props = defineProps<AlertDialogCancelProps & { class?: HTMLAttributes["class"] }>();
</script>

<template>
	<AlertDialogCancel
		:class="cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0', props.class)"
		v-bind="props"
	>
		<slot />
	</AlertDialogCancel>
</template>
