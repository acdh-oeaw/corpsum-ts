<script setup lang="ts">
import type {
	PublishedVisualizationResponse,
	PublishedVisualizationTombstoneResponse,
} from "~/server/utils/published-visualization-response";

definePageMeta({
	layout: "full-page",
});

useHead({
	meta: [{ name: "robots", content: "noindex" }],
});

const route = useRoute();
const uid = computed(() => {
	const value = route.params.uid;
	return Array.isArray(value) ? value[0] : value;
});

const { data: snapshot } = await useFetch<
	PublishedVisualizationResponse | PublishedVisualizationTombstoneResponse
>(() => `/api/published-visualization/${uid.value}`);

const isTombstone = computed(() => snapshot.value && "tombstone" in snapshot.value);
const publicSnapshot = computed(() => {
	const value = snapshot.value;
	if (!value || "tombstone" in value) return null;
	return value;
});
</script>

<template>
	<div class="w-full min-w-0 p-3">
		<div v-if="isTombstone" class="rounded-md border p-4 text-sm text-muted-foreground">
			This published visualization is no longer publicly available.
		</div>
		<PublishedVisualizationRenderer v-else-if="publicSnapshot" embed :snapshot="publicSnapshot" />
	</div>
</template>
