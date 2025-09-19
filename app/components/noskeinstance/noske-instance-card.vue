<script setup lang="ts">
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

const auth = useAuth();

const props = defineProps<{
	noskeInstance: PopulatedNoskeDocument;
}>();

const noskeInstance = toRefs(props).noskeInstance;
</script>

<template>
	<Card class="w-[350px]">
		<CardHeader>
			<CardTitle>{{ noskeInstance.name }}</CardTitle>
			<CardDescription> Owned by: {{ noskeInstance.owner.username }}</CardDescription>
		</CardHeader>
		<CardContent>
			<p><span class="text-xs">Version:</span> {{ noskeInstance.version }}</p>
			<p><span class="text-xs">Host:</span> {{ noskeInstance.host }}</p>
			<p><span class="text-xs">Public:</span> {{ noskeInstance.public ? "Yes" : "No" }}</p>
			<p><span class="text-xs">Authentication:</span> {{ noskeInstance.authentication }}</p>
		</CardContent>
		<CardFooter class="flex justify-between px-6 pb-6">
			<Button :disabled="noskeInstance.owner.username !== auth.username"> Edit </Button>
			<NuxtLinkLocale :href="{ path: `/noskeinstance/${noskeInstance._id}` }">
				<Button variant="outline"> View Details </Button>
			</NuxtLinkLocale>
		</CardFooter>
	</Card>
</template>
