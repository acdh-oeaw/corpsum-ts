<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import { Map, PieChart } from "lucide-vue-next";

import { getQueryWithFacetting } from "@/utils/corpus-query";
import type { components } from "~/lib/noske-types";

type FreqMlResponse = components["schemas"]["11_freqml"];

const t = useTranslations();
const props = defineProps<{
	queries: Array<CorpusQuery>;
}>();

const queries = computed(() => props.queries);
const noskeId = computed(() => queries.value[0]?.noske ?? null);
const { client } = useNoskeClient(noskeId);

const regionalFrequencies: Ref<Array<RegionalFrequency>> = ref([]);
const regionalFrequenciesLoading: Ref<Array<boolean>> = ref([]);

const chartMode: Ref<"combined" | "separate"> = ref("combined");

const isCombined = computed(() => chartMode.value === "combined");

const q = computed(() =>
	queries.value.map((query, index) => {
		const queryKey = [
			"get-regional-frequencies",
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
				regionalFrequenciesLoading.value[index] = true;
				const { data, error } = await activeClient.GET("/search/freqml", {
					headers: createNoskeCacheHeaders(queryKey),
					params: {
						query: {
							corpname: query.corpus,
							usesubcorp: query.subCorpus || undefined,
							group: 0,
							showpoc: 1,
							showreltt: 1,
							showrel: 1,
							freqlevel: 1,
							ml1attr: "doc.region",
							ml1ctx: "0~0 > 0",
							json: JSON.stringify({ concordance_query: getQueryWithFacetting(query) }),
						},
					},
				});
				if (error) throw error;
				return data;
			},
			select: (data: FreqMlResponse) => {
				regionalFrequencies.value[index] = {
					query: query.id,
					data:
						data.Blocks?.map(
							(block) =>
								block.Items?.map((item) => {
									return {
										region: item.Word?.[0]?.n ?? "",
										absolute: item.frq!,
										relative: item.reltt!,
									};
								}) ?? [],
						)[0] ?? [],
				};
				regionalFrequenciesLoading.value[index] = false;
			},
		};
	}),
);

useQueries({ queries: q });

const loading = computed(() => {
	return regionalFrequenciesLoading.value.reduce((a, b) => a || b, false);
});

const mode: Ref<"relative" | "absolute"> = ref("relative");

watch(mode, (value?: string) => {
	if (!value) mode.value = "relative";
});

watch(queries, () => {
	const queryIds = queries.value.map(({ id }) => id);
	regionalFrequencies.value = regionalFrequencies.value.filter(({ query }) =>
		queryIds.includes(query),
	);
	regionalFrequencies.value = regionalFrequencies.value.filter(
		(entry, idx) =>
			regionalFrequencies.value.findIndex((item) => item.query === entry.query) === idx,
	);
});

const expand = ref(false);
</script>

<template>
	<Card>
		<CardHeader>
			<CardTitle>{{ t("regionalFrequencies") }}</CardTitle>
			<CardDescription>{{ t("regionalFrequenciesDesc") }}</CardDescription>
		</CardHeader>

		<CardContent class="space-y-4">
			<div class="flex flex-wrap items-center gap-3">
				<ToggleGroup v-model="chartMode" class="flex" type="single">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger as-child>
								<div>
									<ToggleGroupItem value="combined">
										<Map class="mr-1 size-4" />
										<PieChart class="size-4" />
									</ToggleGroupItem>
								</div>
							</TooltipTrigger>
							<TooltipContent>combined map chart</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger as-child>
								<div>
									<ToggleGroupItem value="separate">
										<Map class="mr-1 size-4" />
										<Map class="size-4" />
									</ToggleGroupItem>
								</div>
							</TooltipTrigger>
							<TooltipContent>separate map charts</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</ToggleGroup>
				<ToggleGroup v-model="mode" class="flex" type="single">
					<ToggleGroupItem value="absolute">{{ t("absolute") }}</ToggleGroupItem>
					<ToggleGroupItem value="relative">{{ t("relative") }}</ToggleGroupItem>
				</ToggleGroup>
			</div>

			<div v-for="(query, index) of queries" :key="query.id">
				<div class="mt-1">
					<QueryDisplay
						:loading="regionalFrequenciesLoading[index]"
						:query="query"
						:query-key="q[index]?.queryKey"
					/>
					<ClientOnly v-if="!regionalFrequenciesLoading[index] && regionalFrequencies[index]">
						<MapChart
							v-if="!isCombined"
							:mode="mode"
							:query="query"
							:resdata="regionalFrequencies[index].data"
						/>
					</ClientOnly>
				</div>
			</div>
			<div v-if="isCombined && !loading && queries.length > 0">
				<CombinedMapChart :mode="mode" :queries="queries" :resdata="regionalFrequencies" />
			</div>
		</CardContent>

		<Collapsible v-model:open="expand">
			<CollapsibleContent class="px-6 pb-6">
				<DataDisplaySourceTable
					:data="regionalFrequencies.map((entry) => entry.data)"
					datatype="regionalFrequencies"
					:loading="regionalFrequenciesLoading"
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
