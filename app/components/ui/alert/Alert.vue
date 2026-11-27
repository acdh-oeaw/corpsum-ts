<script setup lang="ts">
import type { HTMLAttributes } from "vue";

import { cn } from "@/lib/utils";

const props = defineProps<{
	class?: HTMLAttributes["class"];
	variant?: "default" | "destructive";
}>();
</script>

<template>
	<div
		role="alert"
		:class="
			cn(
				'relative w-full rounded-lg border bg-card px-4 py-3 text-sm text-card-foreground',
				variant === 'destructive' && 'border-destructive/50 text-destructive',
				props.class,
			)
		"
	>
		<slot />
	</div>
</template>
