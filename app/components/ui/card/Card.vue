<script setup lang="ts">
import type { HTMLAttributes } from "vue";

import { cn } from "@/lib/utils";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
	<div
		:class="
			cn(
				'rounded-md border border-border bg-card text-card-foreground transition-shadow duration-200 ease-in-out hover:shadow-[0_0_16px_2px_rgb(0_0_0/0.18)]',
				props.class,
			)
		"
	>
		<slot />
	</div>
</template>
