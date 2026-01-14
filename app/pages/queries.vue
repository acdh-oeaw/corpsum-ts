<script lang="ts" setup>
import QueryCard from "@/components/query/query-card.vue";
import type { QueryListItem } from "~/server/api/queries.get.ts";

const t = useTranslations();
const { data: queries } = await useFetch<Array<QueryListItem>>("/api/queries", {});

const featuredQueries = computed(() => queries.value?.slice(0, 10) ?? []);
const remainingQueries = computed(() => queries.value?.slice(10) ?? []);
const formatOwnerNames = (query: QueryListItem) =>
	query.owner
		.map((owner) => owner.username || owner._id)
		.filter((ownerName) => ownerName.length > 0)
		.join(", ");
</script>

<template>
	<MainContent class="w-full">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<PageTitle>{{ t("QueriesPage.title") }}</PageTitle>
			<Button as-child>
				<NuxtLinkLocale :href="{ path: '/query/edit/new' }">New query</NuxtLinkLocale>
			</Button>
		</div>
		<div class="mt-4">
			<div class="flex items-end justify-between">
				<h2 class="text-lg font-semibold">Featured queries</h2>
				<p class="text-sm text-muted-foreground">Showing the first 10 queries</p>
			</div>
			<Carousel class="mt-3 w-full overflow-hidden" :opts="{ align: 'start' }">
				<CarouselContent>
					<CarouselItem v-for="query in featuredQueries" :key="query._id" class="basis-auto">
						<QueryCard :query="query" />
					</CarouselItem>
				</CarouselContent>
				<CarouselPrevious />
				<CarouselNext />
			</Carousel>
		</div>
		<div class="mt-6">
			<div class="flex items-end justify-between">
				<h2 class="text-lg font-semibold">More queries</h2>
				<p class="text-sm text-muted-foreground">Showing all remaining queries</p>
			</div>
			<div class="mt-3 max-w-full overflow-x-auto rounded-md border">
				<Table class="w-full text-sm">
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Corpus</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Owner</TableHead>
							<TableHead class="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow v-for="query in remainingQueries" :key="query._id">
							<TableCell class="font-medium">{{ query.name }}</TableCell>
							<TableCell>{{ query.corpus }}</TableCell>
							<TableCell>{{ query.type }}</TableCell>
							<TableCell>{{ formatOwnerNames(query) }}</TableCell>
							<TableCell class="text-right">
								<Button as-child size="sm" variant="outline">
									<NuxtLinkLocale :href="{ path: `/query/${query._id}` }"> View </NuxtLinkLocale>
								</Button>
							</TableCell>
						</TableRow>
						<TableRow v-if="remainingQueries.length === 0">
							<TableCell class="h-20 text-center text-muted-foreground" colspan="5">
								No more queries to show.
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</div>
	</MainContent>
</template>
