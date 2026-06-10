<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { WithClassAsProps } from "./interface";
import { useCarousel } from "./useCarousel";

const props = defineProps<WithClassAsProps>();

const { orientation, canScrollNext, scrollNext } = useCarousel();
</script>

<template>
	<Button
		:class="
			cn(
				'absolute size-8 touch-manipulation rounded-full p-0',
				orientation === 'horizontal'
					? 'right-2 top-1/2 z-10 -translate-y-1/2'
					: 'bottom-2 left-1/2 z-10 -translate-x-1/2 rotate-90',
				props.class,
			)
		"
		:disabled="!canScrollNext"
		variant="outline"
		@click="scrollNext"
	>
		<slot>
			<ArrowRight class="size-4 text-current" />
			<span class="sr-only">Next Slide</span>
		</slot>
	</Button>
</template>
