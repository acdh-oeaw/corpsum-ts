<script lang="ts" setup>
import QueryCard from "@/components/query/query-card.vue";
import type { QueryListItem } from "~/server/api/queries.get.ts";

const t = useTranslations();
const auth = useAuth();
const { data: queries, refresh } = await useFetch<Array<QueryListItem>>("/api/queries", {});
const deletingId = ref<string | null>(null);

const featuredCount = 5;
const featuredQueries = computed(() => queries.value?.slice(0, featuredCount) ?? []);
const remainingQueries = computed(() => queries.value?.slice(featuredCount) ?? []);
const formatOwnerNames = (query: QueryListItem) =>
	query.owner
		.map((owner) => owner.username || owner._id)
		.filter((ownerName) => ownerName.length > 0)
		.join(", ");

const isOwner = (query: QueryListItem) =>
	query.owner.some((owner) => owner.username === auth.username);

function handleDeleted() {
	void refresh();
}

async function deleteQuery(query: QueryListItem) {
	if (!isOwner(query) || deletingId.value === query._id) return;
	const currentId = query._id;
	deletingId.value = currentId;
	try {
		await $fetch(`/api/query/${currentId}`, { method: "DELETE" });
		handleDeleted();
	} finally {
		if (deletingId.value === currentId) {
			deletingId.value = null;
		}
	}
}
</script>

<template>
	<MainContent class="w-full min-w-0">
		<div class="my-10 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
					<LucideIcon class="size-8 text-foreground" name="Terminal" :stroke-width="2" />
				</div>
				<PageTitle>{{ t("QueriesPage.title") }}</PageTitle>
			</div>
			<div class="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
				<Button as-child size="sm" variant="ghost">
					<NuxtLinkLocale :href="{ path: '/query/edit/new' }">
						<LucideIcon class="mr-1 size-4" name="Plus" :stroke-width="2" />
						{{ t("Actions.newQuery") }}
					</NuxtLinkLocale>
				</Button>
			</div>
		</div>
		<div class="mt-4">
			<div class="flex items-end justify-between">
				<h2 class="text-lg font-semibold">{{ t("QueriesPage.featuredTitle") }}</h2>
				<p class="text-sm text-muted-foreground">
					{{ t("QueriesPage.featuredDescription", { count: featuredCount }) }}
				</p>
			</div>
			<Carousel class="mt-3 w-full" :opts="{ align: 'start' }">
				<CarouselContent>
					<CarouselItem v-for="query in featuredQueries" :key="query._id" class="basis-auto">
						<QueryCard :query="query" @deleted="handleDeleted" />
					</CarouselItem>
				</CarouselContent>
				<CarouselPrevious />
				<CarouselNext />
			</Carousel>
		</div>
		<div class="mt-6">
			<div class="flex items-end justify-between">
				<h2 class="text-lg font-semibold">{{ t("QueriesPage.moreTitle") }}</h2>
				<p class="text-sm text-muted-foreground">{{ t("QueriesPage.moreDescription") }}</p>
			</div>
			<div class="mt-3 max-w-full overflow-x-auto rounded-md border">
				<Table class="w-full text-sm">
					<TableHeader>
						<TableRow>
							<TableHead>{{ t("QueriesPage.table.name") }}</TableHead>
							<TableHead>{{ t("QueriesPage.table.corpus") }}</TableHead>
							<TableHead>{{ t("QueriesPage.table.type") }}</TableHead>
							<TableHead>{{ t("QueriesPage.table.owner") }}</TableHead>
							<TableHead class="text-right">{{ t("QueriesPage.table.actions") }}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow v-for="query in remainingQueries" :key="query._id">
							<TableCell class="font-medium">{{ query.name }}</TableCell>
							<TableCell>{{ query.corpus }}</TableCell>
							<TableCell>{{ query.type }}</TableCell>
							<TableCell>{{ formatOwnerNames(query) }}</TableCell>
							<TableCell class="text-right">
								<TooltipProvider :delay-duration="150">
									<div
										class="inline-flex w-full flex-nowrap items-center justify-end gap-1 rounded-md border bg-muted/40 p-1"
									>
										<Tooltip>
											<TooltipTrigger as-child>
												<Button
													as-child
													class="flex-1"
													:disabled="!isOwner(query)"
													size="sm"
													variant="ghost"
												>
													<NuxtLinkLocale :href="{ path: `/query/edit/${query._id}` }">
														<LucideIcon class="size-4" name="Pencil" :stroke-width="2" />
													</NuxtLinkLocale>
												</Button>
											</TooltipTrigger>
											<TooltipContent>{{ t("Actions.edit") }}</TooltipContent>
										</Tooltip>
										<AlertDialog>
											<Tooltip>
												<TooltipTrigger as-child>
													<AlertDialogTrigger as-child>
														<Button
															class="flex-1 text-destructive hover:text-destructive"
															:disabled="!isOwner(query) || deletingId === query._id"
															size="sm"
															variant="ghost"
														>
															<LucideIcon class="size-4" name="Trash2" :stroke-width="2" />
														</Button>
													</AlertDialogTrigger>
												</TooltipTrigger>
												<TooltipContent>{{ t("Actions.delete") }}</TooltipContent>
											</Tooltip>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>{{ t("Dialogs.deleteQueryTitle") }}</AlertDialogTitle>
													<AlertDialogDescription>
														{{
															t("Dialogs.deleteQueryDescription", {
																name: query.name,
															})
														}}
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>{{ t("Actions.cancel") }}</AlertDialogCancel>
													<AlertDialogAction
														:disabled="deletingId === query._id"
														@click="deleteQuery(query)"
													>
														{{ t("Actions.delete") }}
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
										<Tooltip>
											<TooltipTrigger as-child>
												<Button as-child class="flex-1" size="sm" variant="ghost">
													<NuxtLinkLocale :href="{ path: `/query/${query._id}` }">
														<LucideIcon class="size-4" name="Eye" :stroke-width="2" />
													</NuxtLinkLocale>
												</Button>
											</TooltipTrigger>
											<TooltipContent>{{ t("Actions.view") }}</TooltipContent>
										</Tooltip>
									</div>
								</TooltipProvider>
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
