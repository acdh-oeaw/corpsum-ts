<script setup lang="ts">
defineProps<{ sorted: false | "asc" | "desc" }>();
const t = useTranslations();
</script>

<template>
	<button
		type="button"
		:title="t(sorted === 'asc' ? 'Table.sortDescending' : 'Table.sortAscending')"
		class="inline-flex shrink-0 items-center gap-1 rounded-sm text-left text-inherit hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
	>
		<span><slot /></span>
		<span aria-hidden="true">{{ sorted === "asc" ? "↑" : sorted === "desc" ? "↓" : "" }}</span>
	</button>
</template>
