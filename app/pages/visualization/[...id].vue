<script setup lang="ts">
import DataDisplayCollocations from "@/components/data-display/data-display-collocations.vue";
import DataDisplayKeywordInContext from "@/components/data-display/data-display-keyword-in-context.vue";
import DataDisplayMediaSource from "@/components/data-display/data-display-media-source.vue";
import DataDisplayMediaType from "@/components/data-display/data-display-media-type.vue";
import DataDisplayRegionalFrequencies from "@/components/data-display/data-display-regional-frequencies.vue";
import DataDisplaySourceTable from "@/components/data-display/data-display-source-table.vue";
import DataDisplayWordFormFrequencies from "@/components/data-display/data-display-word-form-frequencies.vue";
import DataDisplayYearlyFrequencies from "@/components/data-display/data-display-yearly-frequencies.vue";
import { colors } from "@/utils/colors";
import type { QueryListItem } from "~/server/api/queries.get.ts";
import type { VisualizationResponse } from "~/server/api/visualization/[id].get.ts";

type VisualizationType =
	| "data-display-collocations"
	| "data-display-keyword-in-context"
	| "data-display-media-source"
	| "data-display-media-type"
	| "data-display-regional-frequencies"
	| "data-display-source-table"
	| "data-display-word-form-frequencies"
	| "data-display-yearly-frequencies";

const t = useTranslations();
const route = useRoute();
const queryStore = useQueryStore();

const visualizationId = computed(() => {
	const idParam = route.params.id;
	return Array.isArray(idParam) ? idParam[0] : idParam;
});

const { data: visualization } = await useFetch<VisualizationResponse>(
	() => `/api/visualization/${visualizationId.value}`,
);
const { data: queries } = await useFetch<Array<QueryListItem>>("/api/queries", {});

const queriesList = computed(() => queries.value ?? []);
const selectedQueryItems = computed(() => {
	const selected = new Set(visualization.value?.queries ?? []);
	return queriesList.value.filter((query) => selected.has(query._id));
});

const visualizationComponents: Record<VisualizationType, unknown> = {
	"data-display-collocations": DataDisplayCollocations,
	"data-display-keyword-in-context": DataDisplayKeywordInContext,
	"data-display-media-source": DataDisplayMediaSource,
	"data-display-media-type": DataDisplayMediaType,
	"data-display-regional-frequencies": DataDisplayRegionalFrequencies,
	"data-display-source-table": DataDisplaySourceTable,
	"data-display-word-form-frequencies": DataDisplayWordFormFrequencies,
	"data-display-yearly-frequencies": DataDisplayYearlyFrequencies,
};

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
						v-for="item in visualization.visualizations"
						:key="item"
					/>
				</div>
			</div>
		</div>
	</MainContent>
</template>
