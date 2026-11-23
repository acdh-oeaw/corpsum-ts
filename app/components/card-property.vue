<script setup lang="ts">
defineProps<{
	label: string;
}>();
</script>

<template>
	<div class="flex min-w-0 items-center justify-between gap-3">
		<dt class="max-w-2/3 shrink-0 truncate text-xs text-muted-foreground">{{ label }}</dt>
		<dd class="min-w-0 truncate text-end text-sm font-medium">
			<slot />
		</dd>
	</div>
</template>
