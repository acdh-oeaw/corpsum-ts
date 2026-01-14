<script setup lang="ts">
import type { QueryListItem } from "~/server/api/queries.get.ts";

const auth = useAuth();

const props = defineProps<{
	query: QueryListItem;
}>();

const query = toRefs(props).query;
const ownerNames = computed(() =>
	query.value.owner
		.map((owner) => owner.username || owner._id)
		.filter((ownerName) => ownerName.length > 0),
);
const isOwner = computed(() => query.value.owner.some((owner) => owner.username === auth.username));
</script>

<template>
	<Card class="flex h-full w-[350px] flex-col">
		<CardHeader>
			<CardTitle>{{ query.name }}</CardTitle>
			<CardDescription>Corpus: {{ query.corpus }}</CardDescription>
		</CardHeader>
		<CardContent class="flex-1">
			<p><span class="text-xs">Type:</span> {{ query.type }}</p>
			<p><span class="text-xs">Sub corpus:</span> {{ query.subCorpus }}</p>
			<p><span class="text-xs">Owner:</span> {{ ownerNames.join(", ") }}</p>
			<p><span class="text-xs">Input:</span> {{ query.userInput }}</p>
		</CardContent>
		<CardFooter class="mt-auto flex justify-between px-6 pb-6">
			<NuxtLinkLocale v-if="isOwner" :href="{ path: `/query/edit/${query._id}` }">
				<Button> Edit </Button>
			</NuxtLinkLocale>
			<Button v-else disabled> Edit </Button>
			<NuxtLinkLocale :href="{ path: `/query/${query._id}` }">
				<Button variant="outline"> View Details </Button>
			</NuxtLinkLocale>
		</CardFooter>
	</Card>
</template>
