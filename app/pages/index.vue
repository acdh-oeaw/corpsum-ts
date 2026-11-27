<script lang="ts" setup>
import type { QueryListItem } from "~/server/api/queries.get.ts";

const t = useTranslations();
const auth = useAuth();
const { pins } = usePinnedCorpora();
const { data: instancesData } = useGetNoskeinstances(null, {
	enabled: computed(() => auth.isLoggedIn()),
});
const {
	data: queries,
	refresh: refreshQueries,
	error: queriesError,
	pending: queriesPending,
} = await useFetch<Array<QueryListItem>>("/api/queries", {
	default: () => [],
	immediate: auth.isLoggedIn(),
});
const recentQueries = computed(() =>
	[...queries.value]
		.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
		.slice(0, 5),
);
watch(
	() => auth.username,
	(username) => {
		if (username) {
			void refreshQueries();
		}
	},
);
const accessiblePinnedCorpora = computed(() => {
	if (!auth.isLoggedIn()) return [];
	const instances = Array.isArray(instancesData.value)
		? instancesData.value
		: instancesData.value
			? [instancesData.value]
			: [];
	return pins.value.flatMap((pin) => {
		const instance = instances.find((item) => item._id === pin.instanceId);
		if (!instance) return [];
		return [
			{
				...pin,
				instanceName: instance.name,
				instanceOwner: instance.owner.username,
			},
		];
	});
});
const corpusInfoDescriptors = computed(() =>
	accessiblePinnedCorpora.value.map(({ instanceId, corpus }) => ({
		queryKey: ["pinned-corpus-info", auth.username, instanceId, corpus],
		noske: instanceId,
		corpus,
	})),
);
const corpusInfoResults = useNoskeCorpusInfoQueries(corpusInfoDescriptors);
const pinnedCorpora = computed(() =>
	accessiblePinnedCorpora.value.map((pin, index) => ({
		...pin,
		info: corpusInfoResults.value[index]?.data,
	})),
);
function formatCount(value?: string | number) {
	if (value == null || String(value).trim() === "") return "—";
	const count = Number(value);
	return Number.isFinite(count) ? count.toLocaleString() : "—";
}
usePageMetadata({ title: t("IndexPage.meta.title") });
</script>

<template>
	<MainContent class="grid w-full min-w-0 content-start gap-y-8 py-8">
		<FetchErrorAlert
			v-if="queriesError"
			class="my-3"
			:pending="queriesPending"
			:retry="refreshQueries"
		/>
		<PageTitle>{{ t("IndexPage.title") }}</PageTitle>
		<AppDescription>
			<div class="space-y-3">
				<p>{{ t("IndexPage.welcome") }}</p>
				<p>{{ t("IndexPage.overview") }}</p>
				<p>{{ t("IndexPage.navigation") }}</p>
			</div>
		</AppDescription>
		<section v-if="auth.isLoggedIn()" aria-labelledby="pinned-corpora-title">
			<h2 id="pinned-corpora-title" class="text-lg font-semibold">
				<NuxtLinkLocale
					:to="{ name: 'corpora' }"
					class="inline-flex items-center gap-2 hover:underline"
				>
					<LucideIcon name="BookOpen" class="size-5" :stroke-width="2" />
					{{ t("IndexPage.pinnedCorpora") }}
				</NuxtLinkLocale>
			</h2>
			<p v-if="pinnedCorpora.length === 0" class="mt-3 text-sm text-muted-foreground">
				{{ t("IndexPage.noPinnedCorpora") }}
			</p>
			<Carousel v-else class="mt-3 w-full" :opts="{ align: 'start' }">
				<CarouselContent>
					<CarouselItem
						v-for="item in pinnedCorpora"
						:key="`${item.instanceId}:${item.corpus}`"
						class="basis-auto"
					>
						<Card class="flex h-full w-[350px] flex-col overflow-hidden">
							<CardHeader class="border-b bg-primary text-primary-foreground">
								<TruncatedCardTitle :title="item.corpus" />
								<CardDescription class="truncate font-semibold text-primary-foreground/80">
									{{ t("CorporaPage.instanceOwner") }}: {{ item.instanceOwner || "—" }}
								</CardDescription>
							</CardHeader>
							<CardContent class="flex-1 pt-4">
								<dl class="grid grid-cols-1 gap-2">
									<CardProperty :label="t('CorporaPage.table.language')">
										{{ item.info?.lang || "—" }}
									</CardProperty>
									<CardProperty :label="t('CorporaPage.table.words')">
										{{ formatCount(item.info?.sizes?.wordcount) }}
									</CardProperty>
									<CardProperty :label="t('CorporaPage.table.documents')">
										{{ formatCount(item.info?.sizes?.doccount) }}
									</CardProperty>
									<CardProperty :label="t('CorporaPage.table.noske')">
										{{ item.instanceName }}
									</CardProperty>
								</dl>
							</CardContent>
							<CardFooter class="mt-auto border-t bg-muted/20 p-3"
								><div class="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
									<CorpusPinButton :instance-id="item.instanceId" :corpus="item.corpus" />
									<Button as-child size="sm" variant="ghost"
										><NuxtLinkLocale
											:href="{
												path: '/query/edit/new',
												query: { noske: item.instanceId, corpus: item.corpus },
											}"
											><LucideIcon class="mr-1 size-4" name="Plus" :stroke-width="2" />{{
												t("CorporaPage.table.createQuery")
											}}</NuxtLinkLocale
										></Button
									>
								</div></CardFooter
							>
						</Card>
					</CarouselItem>
				</CarouselContent>
				<CarouselPrevious /><CarouselNext />
			</Carousel>
		</section>
		<section v-if="auth.isLoggedIn()" aria-labelledby="recent-queries-title">
			<h2 id="recent-queries-title" class="text-lg font-semibold">
				<NuxtLinkLocale
					:to="{ name: 'queries' }"
					class="inline-flex items-center gap-2 hover:underline"
				>
					<LucideIcon name="Terminal" class="size-5" :stroke-width="2" />
					{{ t("IndexPage.recentQueries") }}
				</NuxtLinkLocale>
			</h2>
			<p v-if="recentQueries.length === 0" class="mt-3 text-sm text-muted-foreground">
				{{ t("IndexPage.noRecentQueries") }}
			</p>
			<Carousel v-else class="mt-3 w-full" :opts="{ align: 'start' }">
				<CarouselContent>
					<CarouselItem v-for="query in recentQueries" :key="query._id" class="basis-auto">
						<QueryCard :query="query" @deleted="refreshQueries" />
					</CarouselItem>
				</CarouselContent>
				<CarouselPrevious /><CarouselNext />
			</Carousel>
		</section>
	</MainContent>
</template>
