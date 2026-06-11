<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import { BarChart3, BarChart4, ChartBarStacked } from "lucide-vue-next";

import type { components } from "~/lib/noske-types";

type FreqMlResponse = components["schemas"]["11_freqml"];

const t = useTranslations();
const props = defineProps<{
	queries: Array<CorpusQuery>;
}>();
const queries = computed(() => props.queries);
const noskeId = computed(() => queries.value[0]?.noske ?? null);
const { client } = useNoskeClient(noskeId);

const mode: Ref<"absolute" | "relative"> = ref("relative");
const expand = ref(false);

const sourceDistributions: Ref<Array<Array<IsourceDistribution>>> = ref([]);
const sourceDistributionsLoading: Ref<Array<boolean>> = ref([]);

const q = computed(() =>
	queries.value.map((query, index) => {
		const queryKey = [
			"get-source-type-distribution",
			noskeId.value,
			query.corpus,
			query.subCorpus,
			JSON.stringify(getQueryWithFacetting(query)),
		] as const;
		return {
			queryKey,
			enabled: Boolean(client.value),
			queryFn: async () => {
				const activeClient = client.value;
				if (!activeClient) throw new Error("NoSketch client is not ready yet.");
				sourceDistributionsLoading.value[index] = true;
				const { data, error } = await activeClient.GET("/search/freqml", {
					headers: createNoskeCacheHeaders(queryKey),
					params: {
						query: {
							corpname: query.corpus,
							usesubcorp: query.subCorpus || undefined,
							fmaxitems: 5000,
							fpage: 1,
							group: 0,
							showpoc: 1,
							showreltt: 1,
							showrel: 1,
							freqlevel: 1,
							ml1attr: "doc.mediatype",
							ml1ctx: "0~0 > 0",
							json: JSON.stringify({ concordance_query: getQueryWithFacetting(query) }),
						},
					},
				});
				if (error) throw error;
				return data;
			},
			select: (data: FreqMlResponse) => {
				sourceDistributions.value[index] =
					data.Blocks?.map(
						(block) =>
							block.Items?.map((item) => {
								return {
									absolute: item.frq!,
									relative: item.reltt!,
									media: item.Word?.[0]?.n ?? "",
								};
							}) ?? [],
					)[0] ?? [];
				sourceDistributionsLoading.value[index] = false;
			},
		};
	}),
);

useQueries({ queries: q });

const chartMode: Ref<"bar" | "stack" | "percent"> = ref("stack");

const allMediaTypes = computed(() => {
	const allMedia = sourceDistributions.value.flatMap((distribution) =>
		distribution.map((item) => item.media),
	);
	return [...new Set(allMedia)];
});

const mediaTypeSeries = computed(() =>
	queries.value.map((_, index) =>
		(sourceDistributions.value[index] ?? []).map((item) => ({
			label: item.media,
			data: [[item.media, item[mode.value]] as [string, number]],
			color: categoryColors[allMediaTypes.value.indexOf(item.media) % 5],
		})),
	),
);
</script>

<template>
	<Card>
		<CardHeader>
			<CardTitle>{{ t("mediaTypes") }}</CardTitle>
			<CardDescription>{{ t("mediaSourcesDesc") }}</CardDescription>
		</CardHeader>

		<CardContent class="space-y-4">
			<div class="flex flex-wrap items-center gap-3">
				<ToggleGroup v-model="chartMode" class="flex" type="single">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger as-child>
								<div>
									<ToggleGroupItem value="bar">
										<BarChart4 class="mr-1 size-4" />
									</ToggleGroupItem>
								</div>
							</TooltipTrigger>
							<TooltipContent>separate bar chart</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger as-child>
								<div>
									<ToggleGroupItem value="stack">
										<BarChart3 class="mr-1 size-4" />
									</ToggleGroupItem>
								</div>
							</TooltipTrigger>
							<TooltipContent>stacked bar chart</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger as-child>
								<div>
									<ToggleGroupItem value="percent">
										<ChartBarStacked class="mr-1 size-4" />
									</ToggleGroupItem>
								</div>
							</TooltipTrigger>
							<TooltipContent>percentage bar chart</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</ToggleGroup>

				<ToggleGroup v-model="mode" class="flex" type="single">
					<ToggleGroupItem value="absolute">{{ t("absolute") }}</ToggleGroupItem>
					<ToggleGroupItem value="relative">{{ t("relative") }}</ToggleGroupItem>
				</ToggleGroup>
			</div>
			<div v-for="(query, index) of queries" :key="query.id">
				<QueryDisplay
					:loading="sourceDistributionsLoading[index]"
					:query="query"
					:query-key="q[index]?.queryKey"
				/>
			</div>

			<template v-if="sourceDistributions && queries">
				<MediaStackedBarChart
					:mode="mode"
					:queries="queries"
					:source-distributions="sourceDistributions"
					:chart-mode="chartMode"
				/>
			</template>

			<h4 class="mt-16 text-center font-semibold">{{ t("mediaTypeDistribution") }}</h4>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div v-for="(query, index) of queries" :key="query.id">
					<QueryDisplay :query="query" class="justify-center" />
					<Chart chart-type="donut" :series="mediaTypeSeries[index] ?? []" :height="150" />
				</div>
			</div>
		</CardContent>

		<Collapsible v-model:open="expand">
			<CollapsibleContent class="px-6 pb-6">
				<DataDisplaySourceTable
					:data="sourceDistributions"
					datatype="mediaSources"
					:loading="sourceDistributionsLoading"
					:queries="queries"
				/>
			</CollapsibleContent>
		</Collapsible>

		<Separator />

		<CardFooter>
			<Button size="sm" variant="outline" @click="expand = !expand">
				{{ !expand ? t("ShowData") : t("HideData") }}
			</Button>
		</CardFooter>
	</Card>
</template>
