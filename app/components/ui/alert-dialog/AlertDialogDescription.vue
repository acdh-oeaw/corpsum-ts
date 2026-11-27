<script setup lang="ts">
import { AlertDialogDescription, type AlertDialogDescriptionProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/lib/utils";

const props = defineProps<AlertDialogDescriptionProps & { class?: HTMLAttributes["class"] }>();
</script>

<template>
	<AlertDialogDescription :class="cn('text-sm text-muted-foreground', props.class)" v-bind="props">
		<slot />
	</AlertDialogDescription>
</template>
