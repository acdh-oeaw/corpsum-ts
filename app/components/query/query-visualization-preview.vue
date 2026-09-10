<script setup lang="ts">
import QueryVisualizationPanels from "@/components/query/query-visualization-panels.vue";
import { getDefaultVisualizationPreset } from "@/lib/default-visualization-presets";
import {
	getDefaultKwicQueryOptions,
	getKwicAttrsStructsOptions,
	getKwicAuthoritativeOptions,
} from "@/lib/kwic-query-options";
import {
	cloneQueryExecution,
	getQueryExecutionFingerprint,
	queryExecutionMatches,
	type QueryExecutionInput,
} from "@/lib/query-execution";
import {
	type VisualizationSettingsByType,
	type VisualizationSettingsState,
	type VisualizationType,
	normalizeVisualizationSettings,
	serializeVisualizationSettingsState,
} from "@/lib/visualization-types";
import { createCopiedQueryName, queryCopyNameKey } from "@/utils/query-copy";
import type { QueryResponse } from "~/server/api/query/[id].get.ts";

const props = withDefaults(
	defineProps<{
		execution: QueryExecutionInput;
		runId?: number;
		stale?: boolean;
		sourceQuery?: QueryResponse | null;
		allowSave?: boolean;
	}>(),
	{
		runId: 0,
		stale: false,
		sourceQuery: null,
		allowSave: true,
	},
);

const t = useTranslations();
const locale = useLocale();
const localeRoute = useLocaleRoute();
const auth = useAuth();
const { buildCorpusQuery } = useCorpusQueryBuilder();

const executedContext = computed(() => `${props.execution.noske}:${props.execution.corpus}`);
const selectedTypes = ref<Array<VisualizationType>>([]);
const settingsByType = ref<VisualizationSettingsState>({});

watch(
	executedContext,
	() => {
		const preset = getDefaultVisualizationPreset(props.execution.corpus);
		selectedTypes.value = preset.types;
		settingsByType.value = preset.settings;
	},
	{ immediate: true },
);

const corpusQueries = computed(() => [buildCorpusQuery(props.execution, 0)]);
const corpusInfoDescriptors = computed<Array<NoskeCorpusInfoQueryDescriptor>>(() => [
	{
		queryKey: ["get-corp-info", props.execution.noske, props.execution.corpus],
		noske: props.execution.noske,
		corpus: props.execution.corpus,
	},
]);
const corpusInfoResults = useNoskeCorpusInfoQueries(corpusInfoDescriptors);
const kwicReady = computed(() => {
	const result = corpusInfoResults.value[0];
	return Boolean(result && (!result.isPending || result.data !== undefined));
});

watch(
	[corpusQueries, corpusInfoResults],
	([queries, results]) => {
		const query = queries[0];
		if (!query) return;
		const corpusInfo = results[0]?.data;
		const authoritative = getKwicAuthoritativeOptions(corpusInfo);
		const availableOptions = getKwicAttrsStructsOptions(corpusInfo);
		const selectedOptions = getDefaultKwicQueryOptions(authoritative);
		if (JSON.stringify(query.KWICAttrsStructsOptions) !== JSON.stringify(availableOptions)) {
			query.KWICAttrsStructsOptions = availableOptions;
		}
		if (JSON.stringify(query.KWICAttrsStructs) !== JSON.stringify(selectedOptions)) {
			query.KWICAttrsStructs = selectedOptions;
			query.KWICAdditionalViewHeaders = [...selectedOptions.structures];
		}
	},
	{ deep: true, immediate: true },
);

function updatePanelSettings(payload: {
	type: VisualizationType;
	settings: VisualizationSettingsByType[VisualizationType];
}) {
	settingsByType.value = {
		...settingsByType.value,
		[payload.type]: normalizeVisualizationSettings(payload.type, payload.settings),
	};
}

const saveOpen = ref(false);
const visualizationName = ref("");
const saveError = ref("");
const isSaving = ref(false);
interface PromotionAttempt {
	fingerprint: string;
	queryId?: string;
	visualizationId?: string;
}
const promotionAttempt = ref<PromotionAttempt | null>(null);

watch(
	() => props.runId,
	() => {
		promotionAttempt.value = null;
		saveError.value = "";
	},
);

function openSaveDialog() {
	visualizationName.value = t("QueryVisualizationPreview.defaultName", {
		name: props.execution.name || props.execution.userInput,
	});
	saveError.value = "";
	saveOpen.value = true;
}

function toExecutionFields(query: QueryResponse) {
	return {
		noske: query.noske,
		corpus: query.corpus,
		subCorpus: query.subCorpus,
		type: query.type,
		userInput: query.userInput,
		facettingValues: query.facettingValues,
	};
}

async function resolveQueryId(
	execution: QueryExecutionInput,
	attempt: PromotionAttempt,
	sourceQuery: { _id: string; name: string } | null,
) {
	if (attempt.queryId) return attempt.queryId;
	if (sourceQuery?._id) {
		const current = await $fetch<QueryResponse>(`/api/query/${sourceQuery._id}`);
		const isOwned =
			current.owner.some((owner) => owner.username === auth.username) ||
			auth.user?.accounttype === "admin";
		if (isOwned && queryExecutionMatches(execution, toExecutionFields(current))) {
			return current._id;
		}
	}

	const queryName = sourceQuery
		? createCopiedQueryName(
				sourceQuery.name,
				t(queryCopyNameKey, { name: sourceQuery.name }),
				locale.value,
			)
		: execution.name || visualizationName.value;
	const created = await $fetch<{ _id: string }>("/api/query", {
		method: "POST",
		body: { ...execution, name: queryName },
	});
	attempt.queryId = created._id;
	return created._id;
}

async function saveVisualization() {
	if (isSaving.value || !visualizationName.value.trim()) return;
	isSaving.value = true;
	saveError.value = "";
	const execution = cloneQueryExecution(props.execution);
	const fingerprint = getQueryExecutionFingerprint(execution);
	const frozenName = visualizationName.value.trim();
	const frozenTypes = [...selectedTypes.value];
	const frozenSettings = serializeVisualizationSettingsState(frozenTypes, settingsByType.value);
	const sourceQuery = props.sourceQuery
		? { _id: props.sourceQuery._id, name: props.sourceQuery.name }
		: null;
	const attempt =
		promotionAttempt.value?.fingerprint === fingerprint ? promotionAttempt.value : { fingerprint };
	promotionAttempt.value = attempt;
	try {
		if (!attempt.visualizationId) {
			const queryId = await resolveQueryId(execution, attempt, sourceQuery);
			const created = await $fetch<{ _id: string }>("/api/visualization", {
				method: "POST",
				body: {
					name: frozenName,
					queries: [queryId],
					visualizations: frozenTypes,
					settings: frozenSettings,
					data: [],
				},
			});
			attempt.visualizationId = created._id;
		}
		await navigateTo(localeRoute(`/visualization/${attempt.visualizationId}`));
	} catch (error) {
		saveError.value =
			(error as { data?: { message?: string } }).data?.message ??
			t("QueryVisualizationPreview.saveFailed");
	} finally {
		isSaving.value = false;
	}
}
</script>

<template>
	<section class="mt-8 grid gap-6" aria-labelledby="query-preview-title">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 id="query-preview-title" class="text-xl font-semibold">
					{{ t("QueryVisualizationPreview.title") }}
				</h2>
				<p class="text-sm text-muted-foreground">
					{{ t("QueryVisualizationPreview.description") }}
				</p>
			</div>
			<Button v-if="allowSave" type="button" variant="outline" @click="openSaveDialog">
				<LucideIcon class="mr-1 size-4" name="Save" :stroke-width="2" />
				{{ t("QueryVisualizationPreview.save") }}
			</Button>
		</div>

		<p v-if="stale" class="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
			{{ t("QueryVisualizationPreview.stale") }}
		</p>

		<Suspense>
			<QueryVisualizationPanels
				:key="runId"
				:kwic-ready="kwicReady"
				:queries="corpusQueries"
				:selected-types="selectedTypes"
				:settings="settingsByType"
				@update:settings="updatePanelSettings"
			/>
			<template #fallback>
				<p class="text-sm text-muted-foreground">{{ t("QueryVisualizationPreview.loading") }}</p>
			</template>
		</Suspense>

		<Dialog v-model:open="saveOpen">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{{ t("QueryVisualizationPreview.dialogTitle") }}</DialogTitle>
					<DialogDescription>
						{{
							stale
								? t("QueryVisualizationPreview.dialogStaleDescription")
								: t("QueryVisualizationPreview.dialogDescription")
						}}
					</DialogDescription>
				</DialogHeader>
				<div class="grid gap-2">
					<Label for="preview-visualization-name">{{ t("QueryVisualizationPreview.name") }}</Label>
					<Input id="preview-visualization-name" v-model="visualizationName" />
				</div>
				<p v-if="saveError" class="text-sm text-destructive" role="alert">{{ saveError }}</p>
				<DialogFooter>
					<Button type="button" variant="outline" @click="saveOpen = false">
						{{ t("Actions.cancel") }}
					</Button>
					<Button
						:disabled="isSaving || !visualizationName.trim()"
						type="button"
						@click="saveVisualization"
					>
						{{ t("QueryVisualizationPreview.save") }}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</section>
</template>
