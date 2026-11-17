<script setup lang="ts">
import type { components } from "~/lib/noske-types";
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";
import type { QueryListItem } from "~/server/api/queries.get.ts";

type CorporaListItem = components["schemas"]["03_corpora_list"];

const t = useTranslations();
const { data: queries } = await useFetch<Array<QueryListItem>>("/api/queries", {});
const { data: instancesData } = useGetNoskeinstances(null);
const featuredCount = 5;

const instances = computed<Array<PopulatedNoskeDocument>>(() => {
	if (!instancesData.value) return [];
	return Array.isArray(instancesData.value) ? instancesData.value : [instancesData.value];
});

const instanceById = computed(() => {
	const map = new Map<string, PopulatedNoskeDocument>();
	instances.value.forEach((instance) => {
		map.set(instance._id, instance);
	});
	return map;
});

const sortedQueries = computed(() => {
	const list = queries.value ?? [];
	return [...list].sort(
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	);
});

const dedupedCorpora = computed(() => {
	const seen = new Set<string>();
	const items: Array<{ corpus: string; noskeId: string }> = [];
	sortedQueries.value.forEach((query) => {
		const corpus = query.corpus;
		const key = `${query.noske}:${corpus}`;
		if (seen.has(key)) return;
		seen.add(key);
		items.push({ corpus, noskeId: query.noske });
	});
	return items;
});

const formatCount = (value?: number) => (typeof value === "number" ? value.toLocaleString() : "—");

const fetchCorpora = async (instanceId: string) => {
	const path = `/api/noske/${instanceId}/ca/api/corpora`;
	if (import.meta.server) {
		const requestFetch = useRequestFetch() as typeof $fetch;
		const response = await requestFetch<{ data?: Array<CorporaListItem> }>(path);
		return response.data ?? [];
	}
	const response = await $fetch<{ data?: Array<CorporaListItem> }>(path);
	return response.data ?? [];
};

const corporaRecords = useAsyncData(
	"corpora-list",
	async () => {
		if (!dedupedCorpora.value.length || !instances.value.length) return [];

		const noskeIds = Array.from(new Set(dedupedCorpora.value.map((item) => item.noskeId)));
		const corporaByNoske = new Map<string, Array<CorporaListItem>>();

		await Promise.all(
			noskeIds.map(async (noskeId) => {
				const instance = instanceById.value.get(noskeId);
				if (!instance) return;
				const corporaList = await fetchCorpora(instance._id);
				corporaByNoske.set(noskeId, corporaList);
			}),
		);

		const getCorpusKey = (item: CorporaListItem) =>
			item.corpname ?? (item.id != null ? String(item.id) : "");

		return dedupedCorpora.value
			.map((item, index) => {
				const corporaList = corporaByNoske.get(item.noskeId) ?? [];
				const found = corporaList.find((entry) => getCorpusKey(entry) === item.corpus);
				if (!found) return null;
				const instance = instanceById.value.get(item.noskeId);
				return {
					id: `${item.noskeId}-${index}`,
					corpus: item.corpus,
					language: found.language_name ?? found.language_id ?? "—",
					words: found.sizes?.wordcount,
					documents: found.sizes?.doccount,
					noske: instance?.name ?? "—",
					noskeId: item.noskeId,
					baseUrl: instance?.base ?? "",
					rawCorpus: found,
				};
			})
			.filter((item): item is NonNullable<typeof item> => Boolean(item));
	},
	{
		default: () => [],
		watch: [dedupedCorpora, instances],
	},
);

const corpusItems = computed(() => corporaRecords.data.value ?? []);
const featuredCorpora = computed(() => corpusItems.value.slice(0, featuredCount));
const remainingCorpora = computed(() => corpusItems.value.slice(featuredCount));
</script>

<template>
	<MainContent class="w-full min-w-0">
		<div class="my-10 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
					<LucideIcon class="size-8 text-foreground" name="BookOpen" :stroke-width="2" />
				</div>
				<PageTitle>{{ t("CorporaPage.title") }}</PageTitle>
			</div>
		</div>
		<p class="text-sm text-muted-foreground">{{ t("CorporaPage.description") }}</p>
		<div class="mt-4">
			<div class="flex items-end justify-between">
				<h2 class="text-lg font-semibold">{{ t("CorporaPage.featuredTitle") }}</h2>
				<p class="text-sm text-muted-foreground">{{ t("CorporaPage.featuredDescription") }}</p>
			</div>
			<Carousel class="mt-3 w-full" :opts="{ align: 'start' }">
				<CarouselContent>
					<CarouselItem v-for="item in featuredCorpora" :key="item.id" class="basis-auto">
						<Card class="flex h-full w-[350px] flex-col overflow-hidden">
							<CardHeader class="border-b bg-primary text-primary-foreground">
								<CardTitle class="text-2xl font-black tracking-normal">
									{{ item.corpus }}
								</CardTitle>
							</CardHeader>
							<CardContent class="flex-1">
								<p>
									<span class="text-xs">{{ t("CorporaPage.table.language") }}:</span>
									{{ item.language }}
								</p>
								<p>
									<span class="text-xs">{{ t("CorporaPage.table.words") }}:</span>
									{{ formatCount(item.words) }}
								</p>
								<p>
									<span class="text-xs">{{ t("CorporaPage.table.documents") }}:</span>
									{{ formatCount(item.documents) }}
								</p>
								<p>
									<span class="text-xs">{{ t("CorporaPage.table.noske") }}:</span>
									{{ item.noske }}
								</p>
							</CardContent>
							<CardFooter class="mt-auto border-t bg-muted/20 p-3">
								<div class="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
									<Button as-child size="sm" variant="ghost">
										<NuxtLinkLocale
											:href="{
												path: '/query/edit/new',
												query: { noske: item.noskeId, corpus: item.corpus },
											}"
										>
											<LucideIcon class="mr-1 size-4" name="Plus" :stroke-width="2" />
											{{ t("CorporaPage.table.createQuery") }}
										</NuxtLinkLocale>
									</Button>
								</div>
							</CardFooter>
						</Card>
					</CarouselItem>
				</CarouselContent>
				<CarouselPrevious />
				<CarouselNext />
			</Carousel>
		</div>
		<div class="mt-6">
			<div class="flex items-end justify-between">
				<h2 class="text-lg font-semibold">{{ t("CorporaPage.moreTitle") }}</h2>
				<p class="text-sm text-muted-foreground">{{ t("CorporaPage.moreDescription") }}</p>
			</div>
			<CorpusTable
				:corpora="
					remainingCorpora.map((item) => ({
						...item.rawCorpus,
						noskeId: item.noskeId,
						baseUrl: item.baseUrl,
					}))
				"
			/>
		</div>
	</MainContent>
</template>
