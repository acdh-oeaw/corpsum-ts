<script setup lang="ts">
import { AlertDialogAction, type AlertDialogActionProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const props = defineProps<AlertDialogActionProps & { class?: HTMLAttributes["class"] }>();
</script>

<template>
	<AlertDialogAction :class="cn(buttonVariants(), props.class)" v-bind="props">
		<slot />
	</AlertDialogAction>
</template>
