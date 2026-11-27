<script setup lang="ts">
import type { TocLink } from "@nuxt/content";

defineProps<{ links: TocLink[] }>();
</script>

<!-- Adapted from shadcn-docs-nuxt's MIT-licensed TocTree.vue. See the README. -->
<template>
	<ul class="space-y-1">
		<li v-for="link in links" :key="link.id">
			<NuxtLink class="text-muted-foreground hover:text-primary" :to="{ hash: '#' + link.id }">
				{{ link.text }}
			</NuxtLink>
			<DocsTocTree v-if="link.children?.length" class="pl-4" :links="link.children" />
		</li>
	</ul>
</template>
