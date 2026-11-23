<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
	<TooltipProvider :delay-duration="150">
		<Tooltip>
			<TooltipTrigger as-child>
				<CardTitle class="truncate text-2xl font-black tracking-normal" tabindex="0">
					{{ title }}
				</CardTitle>
			</TooltipTrigger>
			<TooltipContent class="max-w-xs wrap-anywhere">{{ title }}</TooltipContent>
		</Tooltip>
	</TooltipProvider>
</template>
