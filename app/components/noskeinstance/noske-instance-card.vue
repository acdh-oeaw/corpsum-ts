<script setup lang="ts">
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

const props = defineProps<{
	noskeInstance: PopulatedNoskeDocument;
}>();

const noskeInstance = toRefs(props).noskeInstance;
</script>

<template>
	<Card>
		<CardHeader>
			<CardTitle>{{ noskeInstance.name }}</CardTitle>
			<CardDescription> Owned by: {{ noskeInstance.owner.username }} </CardDescription>
		</CardHeader>
		<CardContent>
			<p><span class="text-xs">Version:</span> {{ noskeInstance.version }}</p>
			<p><span class="text-xs">Host:</span> {{ noskeInstance.host }}</p>
			<p><span class="text-xs">Public:</span> {{ noskeInstance.public ? "Yes" : "No" }}</p>
			<p><span class="text-xs">Authentication:</span> {{ noskeInstance.authentication }}</p>
		</CardContent>
		<CardFooter> </CardFooter>
	</Card>
</template>
