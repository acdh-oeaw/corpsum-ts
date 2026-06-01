<script setup lang="ts">
import {
	type VisualizationType,
	defaultTemporalFrequencyDistributionSettings,
	temporalFrequencyDistributionType,
	visualizationTypes,
} from "@/lib/visualization-types";
import type { QueryListItem } from "~/server/api/queries.get.ts";

const t = useTranslations();
const localeRoute = useLocaleRoute();
const { data: queries } = await useFetch<Array<QueryListItem>>("/api/queries", {});

const queriesList = computed(() => queries.value ?? []);

const name = ref("");
const selectedQueries = ref<Array<string>>([]);
const selectedVisualizations = ref<Array<VisualizationType>>([]);
const settingsText = computed(() =>
	JSON.stringify(
		selectedVisualizations.value.map((type) =>
			type === temporalFrequencyDistributionType
				? defaultTemporalFrequencyDistributionSettings
				: {},
		),
	),
);
const dataText = ref("[]");
const formError = ref("");
const isSaving = ref(false);
const formId = "visualization-form";
const dialogOpen = ref(false);
const tempSelectedQueries = ref<Array<string>>([]);

const toggleVisualizationSelection = (
	value: VisualizationType,
	checked: boolean | "indeterminate",
) => {
	const items = [...selectedVisualizations.value];
	if (checked) {
		if (!items.includes(value)) {
			items.push(value);
		}
		selectedVisualizations.value = items;
		return;
	}
	selectedVisualizations.value = items.filter((item) => item !== value);
};

const selectedQueryItems = computed(() =>
	queriesList.value.filter((query) => selectedQueries.value.includes(query._id)),
);

const availableQueryItems = computed(() =>
	queriesList.value.filter((query) => !selectedQueries.value.includes(query._id)),
);

const openDialog = () => {
	tempSelectedQueries.value = [...selectedQueries.value];
	dialogOpen.value = true;
};

const toggleTempSelected = (id: string, checked: boolean | "indeterminate") => {
	const items = [...tempSelectedQueries.value];
	if (checked) {
		if (!items.includes(id)) items.push(id);
		tempSelectedQueries.value = items;
		return;
	}
	tempSelectedQueries.value = items.filter((item) => item !== id);
};

const toggleTempSelectedRow = (id: string) => {
	const items = [...tempSelectedQueries.value];
	if (items.includes(id)) {
		tempSelectedQueries.value = items.filter((item) => item !== id);
		return;
	}
	items.push(id);
	tempSelectedQueries.value = items;
};

const applySelection = () => {
	selectedQueries.value = [...tempSelectedQueries.value];
	dialogOpen.value = false;
};

const removeQuery = (id: string) => {
	selectedQueries.value = selectedQueries.value.filter((queryId) => queryId !== id);
};

const parseJsonArray = (value: string): Array<unknown> | null => {
	if (!value.trim()) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
};

async function save() {
	formError.value = "";
	if (isSaving.value) return;
	if (!name.value.trim()) {
		formError.value = t("VisualizationForm.validation.required");
		return;
	}
	if (selectedQueries.value.length === 0 || selectedVisualizations.value.length === 0) {
		formError.value = t("VisualizationForm.validation.required");
		return;
	}

	const settings = parseJsonArray(settingsText.value);
	if (!settings) {
		formError.value = t("VisualizationForm.validation.invalidJsonArray");
		return;
	}
	const data = parseJsonArray(dataText.value);
	if (!data) {
		formError.value = t("VisualizationForm.validation.invalidJsonArray");
		return;
	}

	isSaving.value = true;
	try {
		const created = await $fetch<{ _id: string }>("/api/visualization", {
			method: "POST",
			body: {
				name: name.value.trim(),
				queries: selectedQueries.value,
				visualizations: selectedVisualizations.value,
				settings,
				data,
			},
		});
		await navigateTo(localeRoute(`/visualization/${created._id}`));
	} finally {
		isSaving.value = false;
	}
}

function cancel() {
	navigateTo(localeRoute("/visualizations"));
}
</script>

<template>
	<MainContent class="w-full min-w-0">
		<div class="my-10 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
					<LucideIcon class="size-8 text-foreground" name="ChartColumn" :stroke-width="2" />
				</div>
				<PageTitle>{{ t("VisualizationsPage.newTitle") }}</PageTitle>
			</div>
			<div class="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
				<Button :disabled="isSaving" :form="formId" size="sm" type="submit" variant="ghost">
					<LucideIcon class="mr-1 size-4" name="Save" :stroke-width="2" />
					{{ t("Actions.create") }}
				</Button>
				<Button :disabled="isSaving" size="sm" type="button" variant="ghost" @click="cancel">
					<LucideIcon class="mr-1 size-4" name="X" :stroke-width="2" />
					{{ t("Actions.cancel") }}
				</Button>
			</div>
		</div>
		<form :id="formId" class="flex flex-col gap-6" @submit.prevent="save">
			<div class="grid gap-2">
				<label class="text-sm font-medium" for="viz-name">
					{{ t("VisualizationForm.labels.name") }}
				</label>
				<Input id="viz-name" v-model="name" :disabled="isSaving" type="text" />
			</div>

			<div class="grid gap-2">
				<p class="text-sm font-medium">{{ t("VisualizationForm.labels.queries") }}</p>
				<div class="space-y-2 rounded-md border p-3">
					<Carousel class="w-full" :opts="{ align: 'start' }">
						<CarouselContent>
							<CarouselItem v-for="query in selectedQueryItems" :key="query._id" class="basis-auto">
								<Card
									class="flex h-full w-[350px] flex-col overflow-hidden rounded-sm border-2 border-primary/40 shadow-sm"
								>
									<CardHeader
										class="flex flex-row items-start justify-between gap-2 border-b border-primary bg-primary text-primary-foreground"
									>
										<div>
											<CardDescription class="font-semibold text-primary-foreground/80">
												{{ query.corpus }}
											</CardDescription>
											<CardTitle class="text-2xl font-black tracking-normal">
												{{ query.name }}
											</CardTitle>
										</div>
										<TooltipProvider :delay-duration="150">
											<Tooltip>
												<TooltipTrigger as-child>
													<Button
														class="text-primary-foreground hover:bg-primary-foreground hover:text-primary"
														size="sm"
														variant="ghost"
														@click="removeQuery(query._id)"
													>
														<LucideIcon class="size-4" name="X" :stroke-width="2" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>{{
													t("VisualizationForm.actions.removeQuery")
												}}</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</CardHeader>
									<CardFooter class="flex-col items-start gap-1.5 border-t bg-muted/20 text-sm">
										<div class="line-clamp-1 flex gap-2 font-medium">
											{{ query.type }}
										</div>
										<div class="line-clamp-1 text-muted-foreground">{{ query.userInput }}</div>
									</CardFooter>
								</Card>
							</CarouselItem>
							<CarouselItem class="basis-auto">
								<Card class="flex h-full w-[350px] flex-col rounded-sm border-2 border-dashed">
									<CardHeader>
										<CardDescription>{{ t("VisualizationForm.actions.addQuery") }}</CardDescription>
										<CardTitle class="text-2xl font-black tracking-normal">—</CardTitle>
									</CardHeader>
									<CardFooter class="mt-auto">
										<Button type="button" variant="ghost" @click="openDialog">
											<LucideIcon class="mr-1 size-4" name="Plus" :stroke-width="2" />
											{{ t("VisualizationForm.actions.addQuery") }}
										</Button>
									</CardFooter>
								</Card>
							</CarouselItem>
						</CarouselContent>
						<CarouselPrevious />
						<CarouselNext />
					</Carousel>
					<Dialog v-model:open="dialogOpen">
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{{ t("VisualizationForm.actions.addQuery") }}</DialogTitle>
								<DialogDescription>{{
									t("VisualizationForm.messages.selectQueries")
								}}</DialogDescription>
							</DialogHeader>
							<div class="max-h-64 space-y-2 overflow-auto">
								<div v-if="availableQueryItems.length === 0" class="text-sm text-muted-foreground">
									{{ t("VisualizationForm.messages.noQueries") }}
								</div>
								<div
									v-for="query in queriesList"
									:key="query._id"
									class="flex cursor-pointer items-center gap-2"
									role="button"
									tabindex="0"
									@click="toggleTempSelectedRow(query._id)"
									@keydown.enter.prevent="toggleTempSelectedRow(query._id)"
									@keydown.space.prevent="toggleTempSelectedRow(query._id)"
								>
									<Checkbox
										:model-value="tempSelectedQueries.includes(query._id)"
										@click.stop
										@update:model-value="toggleTempSelected(query._id, $event)"
									/>
									<span class="text-sm">{{ query.name }}</span>
								</div>
							</div>
							<DialogFooter>
								<Button type="button" variant="outline" @click="dialogOpen = false">
									{{ t("Actions.cancel") }}
								</Button>
								<Button type="button" @click="applySelection">{{ t("Actions.save") }}</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<div class="grid gap-2">
				<p class="text-sm font-medium">{{ t("VisualizationForm.labels.visualizations") }}</p>
				<div class="space-y-2 rounded-md border p-3">
					<div
						v-for="visualization in visualizationTypes"
						:key="visualization"
						class="flex items-center gap-2"
					>
						<Checkbox
							:model-value="selectedVisualizations.includes(visualization)"
							@update:model-value="toggleVisualizationSelection(visualization, $event)"
						/>
						<span class="text-sm">{{ visualization }}</span>
					</div>
				</div>
			</div>

			<input id="viz-settings" :value="settingsText" type="hidden" />
			<input id="viz-data" v-model="dataText" type="hidden" />

			<p v-if="formError" class="text-sm text-destructive" role="alert">
				{{ formError }}
			</p>
		</form>
	</MainContent>
</template>
