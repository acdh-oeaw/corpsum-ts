<script setup lang="ts">
import type { HTMLAttributes } from "vue";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
	<Separator :class="cn('mx-2 w-auto bg-sidebar-border', props.class)" data-sidebar="separator">
		<slot />
	</Separator>
</template>
