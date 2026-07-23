<script setup lang="ts">
import VisualizationDetailPage from "@/pages/visualization/[...id].vue";
</script>

<template>
	<Suspense>
		<VisualizationDetailPage />
	</Suspense>
</template>
