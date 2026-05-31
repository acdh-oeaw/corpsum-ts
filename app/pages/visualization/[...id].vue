<script setup lang="ts">
import DataDisplayCollocations from "@/components/data-display/data-display-collocations.vue";
import DataDisplayKeywordInContext from "@/components/data-display/data-display-keyword-in-context.vue";
import DataDisplayMediaSource from "@/components/data-display/data-display-media-source.vue";
import DataDisplayMetadataTemporalFrequencyDistribution from "@/components/data-display/data-display-metadata-temporal-frequency-distribution.vue";
import DataDisplayRegionalFrequencies from "@/components/data-display/data-display-regional-frequencies.vue";
import DataDisplaySourceTable from "@/components/data-display/data-display-source-table.vue";
import DataDisplayWordFormFrequencies from "@/components/data-display/data-display-word-form-frequencies.vue";
import { colors } from "@/utils/colors";
import {
	type VisualizationType,
	normalizeTemporalFrequencyDistributionSettings,
	temporalFrequencyDistributionType,
} from "~/lib/visualization-types";
import type { QueryListItem } from "~/server/api/queries.get.ts";
import type { VisualizationResponse } from "~/server/api/visualization/[id].get.ts";

const t = useTranslations();
const route = useRoute();
const queryStore = useQueryStore();
const env = useRuntimeConfig();

const visualizationId = computed(() => {
	const idParam = route.params.id;
	return Array.isArray(idParam) ? idParam[0] : idParam;
});

const { data: visualization } = await useFetch<VisualizationResponse>(
	() => `/api/visualization/${visualizationId.value}`,
);
const { data: queries } = await useFetch<Array<QueryListItem>>("/api/queries", {});
const publishOpen = ref(false);
const publishTitle = ref("");
const publishDescription = ref("");
const publishError = ref("");
const isPublishing = ref(false);
const publishedUid = ref("");

const queriesList = computed(() => queries.value ?? []);
const corpusQueries = computed(() => queryStore.queries);
const selectedQueryItems = computed(() => {
	const selected = new Set(visualization.value?.queries ?? []);
	return queriesList.value.filter((query) => selected.has(query._id));
});

const visualizationComponents: Record<VisualizationType, unknown> = {
	"data-display-collocations": DataDisplayCollocations,
	"data-display-keyword-in-context": DataDisplayKeywordInContext,
	"data-display-media-source": DataDisplayMediaSource,
	"data-display-regional-frequencies": DataDisplayRegionalFrequencies,
	"data-display-source-table": DataDisplaySourceTable,
	"data-display-word-form-frequencies": DataDisplayWordFormFrequencies,
	[temporalFrequencyDistributionType]: DataDisplayMetadataTemporalFrequencyDistribution,
};

const publishedLink = computed(() => {
	if (!publishedUid.value) return "";
	return new URL(`/v/${publishedUid.value}`, env.public.appBaseUrl).toString();
});

function escapeAttribute(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

const embedSnippet = computed(() => {
	if (!publishedUid.value) return "";
	const src = new URL(`/v/${publishedUid.value}/embed`, env.public.appBaseUrl).toString();
	return `<iframe src="${src}" width="100%" height="720" loading="lazy" style="border:0;" title="${escapeAttribute(publishTitle.value)}"></iframe>`;
});

const keyToKey: Record<CorpusQueryType, CorpusQueryTypeValue> = {
	charrow: "char",
	cqlrow: "cql",
	iqueryrow: "iquery",
	lemmarow: "lemma",
	phraserow: "phrase",
	wordrow: "word",
};

const buildFinalQuery = (type: CorpusQueryType, userInput: string) => {
	switch (type) {
		case "wordrow":
			return `[word="${userInput}"]`;
		case "lemmarow":
			return `[lemma="${userInput}"]`;
		case "cqlrow":
			return userInput;
		case "charrow":
		case "iqueryrow":
		case "phraserow":
			return `[word="${userInput}"]`;
	}
	return `[word="${userInput}"]`;
};

const buildQuery = (item: QueryListItem, index: number): CorpusQuery => {
	const finalQuery = buildFinalQuery(item.type, item.userInput);
	const concordance_query = {
		queryselector: item.type,
		[keyToKey[item.type]]: item.userInput,
	} as ConcordanceQuery;

	return {
		id: index,
		noske: item.noske,
		type: item.type,
		userInput: item.userInput,
		finalQuery,
		preparedQuery: `aword,${finalQuery}`,
		color: colors[index % colors.length] ?? "#111827",
		showPicker: false,
		corpus: item.corpus,
		subCorpus: item.subCorpus,
		concordance_query,
		KWICAttrsStructs: {
			attributes: [],
			structures: [...queryStore.fixedKWICStructures],
		},
		KWICAttrsStructsOptions: {
			attributes: [],
			structures: [],
		},
		KWICAdditionalViewHeaders: [],
		facettingValues: {},
		SampleRatio: 100,
		loading: {
			yearlyFrequencies: false,
			wordFormFrequencies: false,
			regionalFrequencies: false,
			keywordInContext: false,
			mediaSources: false,
			collocations: false,
		},
	};
};

function getVisualizationSettings(index: number, type: VisualizationType) {
	if (type === temporalFrequencyDistributionType) {
		return normalizeTemporalFrequencyDistributionSettings(visualization.value?.settings[index]);
	}
	return visualization.value?.settings[index];
}

watch(
	() => [visualization.value, selectedQueryItems.value],
	() => {
		queryStore.queries = [];
		queryStore.nextQueryId = 0;
		if (!visualization.value) return;
		if (selectedQueryItems.value.length === 0) return;
		selectedQueryItems.value.forEach((item, index) => {
			queryStore.queries.push(buildQuery(item, index));
			queryStore.nextQueryId = index + 1;
		});
	},
	{ immediate: true },
);

watch(
	visualization,
	(value) => {
		if (!value) return;
		publishTitle.value = value.name;
	},
	{ immediate: true },
);

async function publishVisualization() {
	if (!visualization.value || isPublishing.value) return;
	publishError.value = "";
	publishedUid.value = "";
	isPublishing.value = true;
	try {
		const published = await $fetch<{ uid: string }>(
			`/api/visualization/${visualization.value._id}/publish`,
			{
				method: "POST",
				body: {
					title: publishTitle.value.trim() || visualization.value.name,
					description: publishDescription.value,
				},
			},
		);
		publishedUid.value = published.uid;
	} catch (error) {
		const data = (error as { data?: { data?: { missing?: Array<unknown> }; message?: string } })
			.data;
		const missing = data?.data?.missing;
		publishError.value =
			Array.isArray(missing) && missing.length > 0
				? `Cannot publish yet. ${missing.length} cached result(s) are missing; view or refresh the selected visualization panels first.`
				: (data?.message ?? "Publishing failed.");
	} finally {
		isPublishing.value = false;
	}
}
</script>

<template>
	<MainContent v-if="visualization" class="w-full min-w-0">
		<div class="my-10 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
					<LucideIcon class="size-8 text-foreground" name="ChartColumn" :stroke-width="2" />
				</div>
				<PageTitle>{{ visualization.name || t("VisualizationsPage.detailTitle") }}</PageTitle>
			</div>
			<div class="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
				<Dialog v-model:open="publishOpen">
					<DialogTrigger as-child>
						<Button size="sm" type="button" variant="ghost">
							<LucideIcon class="mr-1 size-4" name="Upload" :stroke-width="2" />
							Publish
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Publish visualization</DialogTitle>
							<DialogDescription>
								Create an immutable public snapshot from cached NoSketch results.
							</DialogDescription>
						</DialogHeader>
						<div class="grid gap-4">
							<div class="grid gap-2">
								<Label for="published-title">Title</Label>
								<Input id="published-title" v-model="publishTitle" :disabled="isPublishing" />
							</div>
							<div class="grid gap-2">
								<Label for="published-description">Description</Label>
								<textarea
									id="published-description"
									v-model="publishDescription"
									class="min-h-28 rounded-md border bg-background px-3 py-2 text-sm"
									:disabled="isPublishing"
								></textarea>
							</div>
							<p v-if="publishError" class="text-sm text-destructive">{{ publishError }}</p>
							<div v-if="publishedUid" class="grid gap-2 rounded-md border bg-muted/40 p-3 text-sm">
								<p class="font-medium">Published link</p>
								<a class="break-all underline" :href="publishedLink">{{ publishedLink }}</a>
								<p class="font-medium">Embed snippet</p>
								<code class="whitespace-pre-wrap break-all rounded bg-background p-2 text-xs">{{
									embedSnippet
								}}</code>
							</div>
						</div>
						<DialogFooter>
							<Button
								:disabled="isPublishing || !publishTitle.trim()"
								@click="publishVisualization"
							>
								{{ isPublishing ? "Publishing..." : "Publish" }}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</div>

		<div class="grid gap-6">
			<div class="grid gap-2">
				<p class="text-sm font-medium">{{ t("VisualizationForm.labels.queries") }}</p>
				<div class="space-y-2 rounded-md border p-3">
					<div v-if="selectedQueryItems.length === 0" class="text-sm text-muted-foreground">
						{{ t("VisualizationForm.messages.noQueries") }}
					</div>
					<Carousel v-else class="w-full" :opts="{ align: 'start' }">
						<CarouselContent>
							<CarouselItem v-for="query in selectedQueryItems" :key="query._id" class="basis-auto">
								<Card
									class="flex h-full w-[350px] flex-col overflow-hidden rounded-sm border-2 border-primary/40 shadow-sm"
								>
									<CardHeader class="border-b border-primary bg-primary text-primary-foreground">
										<CardDescription class="font-semibold text-primary-foreground/80">
											{{ query.corpus }}
										</CardDescription>
										<CardTitle class="text-2xl font-black tracking-normal">
											{{ query.name }}
										</CardTitle>
									</CardHeader>
									<CardFooter class="flex-col items-start gap-1.5 border-t bg-muted/20 text-sm">
										<div class="line-clamp-1 flex gap-2 font-medium">
											{{ query.type }}
										</div>
										<div class="line-clamp-1 text-muted-foreground">{{ query.userInput }}</div>
									</CardFooter>
								</Card>
							</CarouselItem>
						</CarouselContent>
						<CarouselPrevious />
						<CarouselNext />
					</Carousel>
				</div>
			</div>

			<div class="grid gap-3">
				<p class="text-sm font-medium">{{ t("VisualizationForm.labels.visualizations") }}</p>
				<div class="grid gap-4">
					<component
						:is="visualizationComponents[item]"
						v-for="(item, index) in visualization.visualizations"
						:key="`${item}-${index}`"
						:queries="corpusQueries"
						:settings="getVisualizationSettings(index, item)"
					/>
				</div>
			</div>
		</div>
	</MainContent>
</template>
