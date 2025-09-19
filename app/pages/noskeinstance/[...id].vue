<script setup lang="ts">
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

const route = useRoute();

const { data: noskeInstance } = await useFetch<PopulatedNoskeDocument>(
	() => `/api/noskeinstances/${route.params.id}`,
);
</script>

<template>
	<MainContent v-if="noskeInstance" class="">
		<PageTitle>{{ noskeInstance.name }}</PageTitle>
		<div class="flex flex-col gap-3">
			<p><span class="text-xs">Version:</span> {{ noskeInstance.version }}</p>
			<p><span class="text-xs">Host:</span> {{ noskeInstance.host }}</p>
			<p><span class="text-xs">Public:</span> {{ noskeInstance.public ? "Yes" : "No" }}</p>
			<p><span class="text-xs">Authentication:</span> {{ noskeInstance.authentication }}</p>
			<p><span class="text-xs">Owned by:</span> {{ noskeInstance.owner.username }}</p>
		</div>
	</MainContent>
</template>
