<script lang="ts" setup>
import { docsRoute } from "@/utils/docs-route";
const route = useRoute();
const t = useTranslations();
const collection = useDocsCollection();
const path = computed(() => route.path.replace(/\/$/, ""));
definePageMeta({ key: (route) => route.path });

const { data: page, error } = await useAsyncData(
	computed(() => `documentation:${collection.value}:${path.value}`),
	async () => {
		const document = await queryCollection(collection.value).path(path.value).first();
		if (!document) {
			throw createError({ statusCode: 404, statusMessage: "Documentation page not found" });
		}
		return document;
	},
);
if (error.value) throw error.value;
usePageMetadata({ title: page.value?.title ?? t("Documentation.title") });

const { data: surroundings } = await useAsyncData(
	computed(() => `documentation-surroundings:${collection.value}:${path.value}`),
	() => queryCollectionItemSurroundings(collection.value, path.value),
);
const searchOpen = ref(false);
const search = ref("");
const { data: sections, execute: loadSearch } = await useAsyncData(
	computed(() => `documentation-search:${collection.value}`),
	() => queryCollectionSearchSections(collection.value),
	{ immediate: false },
);
watch(searchOpen, (open) => {
	if (open && !sections.value) void loadSearch();
});
const results = computed(() => {
	const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
	if (!terms.length) return [];
	return (sections.value ?? [])
		.filter((section) => {
			const text = [section.title, ...section.titles, section.content].join(" ").toLowerCase();
			return terms.every((term) => text.includes(term));
		})
		.slice(0, 20);
});
</script>

<template>
	<MainContent class="grid w-full min-w-0 content-start gap-8 py-8">
		<Dialog v-model:open="searchOpen">
			<DialogTrigger as-child>
				<Button class="justify-self-start" variant="outline">
					<LucideIcon name="Search" />
					{{ t("Documentation.search") }}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogTitle>{{ t("Documentation.search") }}</DialogTitle>
				<Input v-model="search" :aria-label="t('Documentation.search')" type="search" autofocus />
				<ul v-if="results.length" class="max-h-80 space-y-1 overflow-auto">
					<li v-for="result in results" :key="result.id">
						<NuxtLinkLocale
							class="block rounded-md p-2 hover:bg-accent focus-visible:bg-accent"
							:to="docsRoute(result.id)"
							@click="searchOpen = false"
						>
							{{ [...result.titles, result.title].join(" / ") }}
						</NuxtLinkLocale>
					</li>
				</ul>
				<p v-else-if="search.trim() && sections" role="status">
					{{ t("Documentation.noResults") }}
				</p>
			</DialogContent>
		</Dialog>

		<div class="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_12rem]">
			<nav
				v-if="page?.body?.toc?.links.length"
				class="lg:order-last"
				:aria-label="t('Documentation.toc')"
			>
				<h2 class="mb-2 font-semibold">{{ t("Documentation.toc") }}</h2>
				<DocsTocTree :links="page.body.toc.links" />
			</nav>
			<ContentRenderer v-if="page" class="prose min-w-0 dark:prose-invert" :value="page" />
		</div>

		<nav
			v-if="surroundings?.some(Boolean)"
			class="grid grid-cols-2 gap-4"
			:aria-label="t('Documentation.title')"
		>
			<div
				v-for="(label, index) in [t('Documentation.previous'), t('Documentation.next')]"
				:key="label"
			>
				<NuxtLinkLocale
					v-if="surroundings[index]"
					class="block rounded-md border p-3 hover:bg-accent"
					:to="docsRoute(surroundings[index]!.path)"
				>
					<span class="block text-sm text-muted-foreground">{{ label }}</span>
					{{ surroundings[index]?.title }}
				</NuxtLinkLocale>
			</div>
		</nav>
	</MainContent>
</template>
