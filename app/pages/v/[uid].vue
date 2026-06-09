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
	<MainContent class="w-full min-w-0 py-8">
		<div v-if="isTombstone" class="mx-auto grid max-w-3xl gap-3">
			<PageTitle>{{ snapshot?.title ?? "Published visualization unavailable" }}</PageTitle>
			<p class="text-muted-foreground">
				This published visualization is no longer publicly available.
			</p>
		</div>

		<div v-else-if="publicSnapshot" class="grid gap-8">
			<header class="grid gap-3">
				<PageTitle>{{ publicSnapshot.title }}</PageTitle>
				<p
					v-if="publicSnapshot.description"
					class="max-w-3xl whitespace-pre-line text-muted-foreground"
				>
					{{ publicSnapshot.description }}
				</p>
				<p class="text-sm text-muted-foreground">
					Published by {{ publicSnapshot.publisherUsername }} on
					{{ new Date(publicSnapshot.publishedAt).toLocaleDateString() }}
				</p>
			</header>

			<section class="grid gap-3">
				<h2 class="text-lg font-semibold">Queries</h2>
				<div class="overflow-x-auto rounded-md border">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b bg-muted/40 text-left">
								<th class="px-3 py-2">Corpus</th>
								<th class="px-3 py-2">Subcorpus</th>
								<th class="px-3 py-2">Type</th>
								<th class="px-3 py-2">Input</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="query in publicSnapshot.queries"
								:key="query.sourceQueryId"
								class="border-b"
							>
								<td class="px-3 py-2">{{ query.corpus }}</td>
								<td class="px-3 py-2">{{ query.subCorpus }}</td>
								<td class="px-3 py-2">{{ query.type }}</td>
								<td class="px-3 py-2">{{ query.userInput }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<PublishedVisualizationRenderer :snapshot="publicSnapshot" />
		</div>
	</MainContent>
</template>
