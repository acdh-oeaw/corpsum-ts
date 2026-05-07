<script lang="ts" setup>
import type { VisualizationListItem } from "~/server/api/visualizations.get.ts";

const t = useTranslations();
const { data: visualizations, refresh } = await useFetch<Array<VisualizationListItem>>(
	"/api/visualizations",
	{},
);
const deletingId = ref<string | null>(null);

const featuredCount = 5;
const featuredVisualizations = computed(() => visualizations.value?.slice(0, featuredCount) ?? []);
const remainingVisualizations = computed(() => visualizations.value?.slice(featuredCount) ?? []);

function handleDeleted() {
	void refresh();
}

async function deleteVisualization(visualization: VisualizationListItem) {
	if (deletingId.value === visualization._id) return;
	const currentId = visualization._id;
	deletingId.value = currentId;
	try {
		await $fetch(`/api/visualization/${currentId}`, { method: "DELETE" });
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
					<LucideIcon class="size-8 text-foreground" name="ChartColumn" :stroke-width="2" />
				</div>
				<PageTitle>{{ t("VisualizationsPage.title") }}</PageTitle>
			</div>
			<div class="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
				<Button as-child size="sm" variant="ghost">
					<NuxtLinkLocale :href="{ path: '/visualization/new' }">
						<LucideIcon class="mr-1 size-4" name="Plus" :stroke-width="2" />
						{{ t("Actions.newVisualization") }}
					</NuxtLinkLocale>
				</Button>
			</div>
		</div>
		<div class="mt-4">
			<div class="flex items-end justify-between">
				<h2 class="text-lg font-semibold">{{ t("VisualizationsPage.featuredTitle") }}</h2>
				<p class="text-sm text-muted-foreground">
					{{ t("VisualizationsPage.featuredDescription", { count: featuredCount }) }}
				</p>
			</div>
			<Carousel class="mt-3 w-full" :opts="{ align: 'start' }">
				<CarouselContent>
					<CarouselItem
						v-for="visualization in featuredVisualizations"
						:key="visualization._id"
						class="basis-auto"
					>
						<Card
							class="flex h-full w-[350px] flex-col overflow-hidden rounded-sm border-2 border-primary/40 shadow-sm"
						>
							<CardHeader class="border-b border-primary bg-primary text-primary-foreground">
								<CardTitle class="text-2xl font-black tracking-normal">
									{{ visualization.name }}
								</CardTitle>
							</CardHeader>
							<CardContent class="flex-1">
								<p>
									<span class="text-xs">{{ t("VisualizationsPage.card.queryCount") }}:</span>
									{{ visualization.queries.length }}
								</p>
								<p>
									<span class="text-xs"
										>{{ t("VisualizationsPage.card.visualizationCount") }}:</span
									>
									{{ visualization.visualizations.length }}
								</p>
							</CardContent>
							<CardFooter class="mt-auto border-t bg-muted/20 p-3">
								<TooltipProvider :delay-duration="150">
									<div
										class="flex w-full flex-nowrap items-center gap-1 rounded-md border bg-muted/40 p-1"
									>
										<Tooltip>
											<TooltipTrigger as-child>
												<Button as-child class="flex-1" size="sm" variant="ghost">
													<NuxtLinkLocale :href="{ path: `/visualization/${visualization._id}` }">
														<LucideIcon class="size-4" name="Eye" :stroke-width="2" />
													</NuxtLinkLocale>
												</Button>
											</TooltipTrigger>
											<TooltipContent>{{ t("Actions.view") }}</TooltipContent>
										</Tooltip>
										<AlertDialog>
											<Tooltip>
												<TooltipTrigger as-child>
													<AlertDialogTrigger as-child>
														<Button
															class="flex-1 text-destructive hover:text-destructive"
															:disabled="deletingId === visualization._id"
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
													<AlertDialogTitle>
														{{ t("Dialogs.deleteVisualizationTitle") }}
													</AlertDialogTitle>
													<AlertDialogDescription>
														{{
															t("Dialogs.deleteVisualizationDescription", {
																name: visualization.name,
															})
														}}
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>{{ t("Actions.cancel") }}</AlertDialogCancel>
													<AlertDialogAction
														:disabled="deletingId === visualization._id"
														@click="deleteVisualization(visualization)"
													>
														{{ t("Actions.delete") }}
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</TooltipProvider>
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
				<h2 class="text-lg font-semibold">{{ t("VisualizationsPage.moreTitle") }}</h2>
				<p class="text-sm text-muted-foreground">{{ t("VisualizationsPage.moreDescription") }}</p>
			</div>
			<div class="mt-3 max-w-full overflow-x-auto rounded-md border">
				<Table class="w-full text-sm">
					<TableHeader>
						<TableRow>
							<TableHead>{{ t("VisualizationsPage.table.name") }}</TableHead>
							<TableHead>{{ t("VisualizationsPage.table.queryCount") }}</TableHead>
							<TableHead>{{ t("VisualizationsPage.table.visualizationCount") }}</TableHead>
							<TableHead class="text-right">{{ t("VisualizationsPage.table.actions") }}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow v-for="visualization in remainingVisualizations" :key="visualization._id">
							<TableCell class="font-medium">{{ visualization.name }}</TableCell>
							<TableCell>{{ visualization.queries.length }}</TableCell>
							<TableCell>{{ visualization.visualizations.length }}</TableCell>
							<TableCell class="text-right">
								<TooltipProvider :delay-duration="150">
									<div
										class="inline-flex w-full flex-nowrap items-center justify-end gap-1 rounded-md border bg-muted/40 p-1"
									>
										<Tooltip>
											<TooltipTrigger as-child>
												<Button as-child class="flex-1" size="sm" variant="ghost">
													<NuxtLinkLocale :href="{ path: `/visualization/${visualization._id}` }">
														<LucideIcon class="size-4" name="Eye" :stroke-width="2" />
													</NuxtLinkLocale>
												</Button>
											</TooltipTrigger>
											<TooltipContent>{{ t("Actions.view") }}</TooltipContent>
										</Tooltip>
										<AlertDialog>
											<Tooltip>
												<TooltipTrigger as-child>
													<AlertDialogTrigger as-child>
														<Button
															class="flex-1 text-destructive hover:text-destructive"
															:disabled="deletingId === visualization._id"
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
													<AlertDialogTitle>
														{{ t("Dialogs.deleteVisualizationTitle") }}
													</AlertDialogTitle>
													<AlertDialogDescription>
														{{
															t("Dialogs.deleteVisualizationDescription", {
																name: visualization.name,
															})
														}}
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>{{ t("Actions.cancel") }}</AlertDialogCancel>
													<AlertDialogAction
														:disabled="deletingId === visualization._id"
														@click="deleteVisualization(visualization)"
													>
														{{ t("Actions.delete") }}
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</TooltipProvider>
							</TableCell>
						</TableRow>
						<TableRow v-if="remainingVisualizations.length === 0">
							<TableCell class="h-20 text-center text-muted-foreground" colspan="4">
								{{ t("VisualizationsPage.empty") }}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
		</div>
	</MainContent>
</template>
