<script lang="ts" setup>
import { useQueries } from "@tanstack/vue-query";
import { storeToRefs } from "pinia";

import type { components } from "~/lib/noske-types";

type FreqMlResponse = components["schemas"]["11_freqml"];

const t = useTranslations();
const queryStore = useQueryStore();
const { queries } = storeToRefs(queryStore);

const noskeId = computed(() => queries.value[0]?.noske ?? null);
const { client } = useNoskeClient(noskeId);

const wordFormFrequencies: Ref<Array<Array<{ word: string; absolute: number; relative: number }>>> =
	ref([]);
const wordFormFrequenciesLoading: Ref<Array<boolean>> = ref([]);

const q = computed(() =>
	queries.value.map((query, index) => {
		const queryKey = [
			"get-wordform-frequencies",
			noskeId.value,
			query.corpus,
			query.subCorpus,
			JSON.stringify(queryStore.getQueryWithFacetting(query)),
		] as const;
		return {
			queryKey,
			enabled: Boolean(client.value),
			queryFn: async () => {
				const activeClient = client.value;
				if (!activeClient) throw new Error("NoSketch client is not ready yet.");
				wordFormFrequenciesLoading.value[index] = true;
				const { data, error } = await activeClient.GET("/search/freqml", {
					headers: createNoskeCacheHeaders(queryKey),
					params: {
						query: {
							corpname: query.corpus,
							usesubcorp: query.subCorpus || undefined,
							ml1attr: "word",
							ml1ctx: "0<0~0>0",
							json: JSON.stringify({ concordance_query: queryStore.getQueryWithFacetting(query) }),
						},
					},
				});
				if (error) throw error;
				return data;
			},
			select: (data: FreqMlResponse) => {
				wordFormFrequencies.value[index] =
					data.Blocks?.map(
						(block) =>
							block.Items?.map((item) => {
								return {
									word: item.Word?.[0]?.n ?? "",
									absolute: item.frq!,
									relative: item.fpm!,
								};
							}) ?? [],
					)[0] ?? [];
				wordFormFrequenciesLoading.value[index] = false;
			},
		};
	}),
);

useQueries({ queries: q });

const mode = ref("relative");
const expand = ref(false);
</script>

<template>
	<Card>
		<CardHeader>
			<CardTitle>{{ t("wordFormFrequencies") }}</CardTitle>
			<CardDescription>{{ t("wordFormFrequenciesDesc") }}</CardDescription>
		</CardHeader>

		<CardContent class="space-y-4">
			<ToggleGroup v-model="mode" class="flex" type="single">
				<ToggleGroupItem value="absolute">{{ t("absolute") }}</ToggleGroupItem>
				<ToggleGroupItem value="relative">{{ t("relative") }}</ToggleGroupItem>
			</ToggleGroup>
			<div v-for="(query, index) of queries" :key="query.id">
				<QueryDisplay
					:loading="wordFormFrequenciesLoading[index]"
					:query="query"
					:query-key="q[index]?.queryKey"
				/>
				<Chart
					chart-type="bar"
					class="h-96"
					orientation="horizontal"
					:series="[
						{
							color: query.color,
							name: `${query.type}: ${query.userInput} (${query.corpus}${
								query.subCorpus ? ` / ${query.subCorpus})` : ')'
							}`,
							data:
								wordFormFrequencies[index]?.map(({ relative, absolute, word }) => [
									word,
									mode === 'relative' ? relative : absolute,
								]) ?? [],
						},
					]"
					:title="`${query.userInput}`"
					:y-axis="t('sources')"
				></Chart>
			</div>
		</CardContent>

		<Collapsible v-model:open="expand">
			<CollapsibleContent class="px-6 pb-6">
				<DataDisplaySourceTable
					:data="wordFormFrequencies"
					datatype="wordFormFrequencies"
					:loading="wordFormFrequenciesLoading"
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
