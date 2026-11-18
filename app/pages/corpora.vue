<script setup lang="ts">
const t = useTranslations();
const featuredCount = 5;
const { data: corpusItems } = await useFetch("/api/corpus-catalogue", { default: () => [] });
const formatCount = (value?: number) => (typeof value === "number" ? value.toLocaleString() : "—");
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
