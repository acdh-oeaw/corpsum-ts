<script lang="ts" setup>
import { Hash, Info, Rows3, Weight } from "lucide-vue-next";

import {
	type CollocationVisualizationSettings,
	normalizeCollocationVisualizationSettings,
} from "@/lib/visualization-types";
import { getQueryWithFacetting } from "@/utils/corpus-query";
import type { components } from "~/lib/noske-types";

type CollxResponse = components["schemas"]["10_collx"];

interface CollocationEntry {
	word: string;
	freq: number;
	coll_freq: number;
	d: number;
	m: number;
	t: number;
	name: string;
	weight: number;
	color: string;
}

const props = withDefaults(
	defineProps<{
		queries: Array<CorpusQuery>;
		data?: Array<CollxResponse | null | undefined>;
		interactive?: boolean;
		settings?: Partial<CollocationVisualizationSettings>;
		showHeader?: boolean;
		showSourceData?: boolean;
	}>(),
	{
		data: undefined,
		interactive: true,
		settings: undefined,
		showHeader: true,
		showSourceData: true,
	},
);

const emit = defineEmits<{
	"update:settings": [settings: CollocationVisualizationSettings];
	"loading-change": [loading: boolean];
}>();

const t = useTranslations();
const queries = computed(() => props.queries);
const usesProvidedData = computed(() => props.data !== undefined);
const normalizedSettings = computed(() =>
	normalizeCollocationVisualizationSettings(props.settings),
);
const mode = ref(normalizedSettings.value.mode);
const cattr = ref(normalizedSettings.value.cattr);
const expand = ref(normalizedSettings.value.sourceTableExpanded);

watch(
	normalizedSettings,
	(value) => {
		mode.value = value.mode;
		cattr.value = value.cattr;
		expand.value = value.sourceTableExpanded;
	},
	{ deep: true },
);

function emitSettings() {
	emit(
		"update:settings",
		normalizeCollocationVisualizationSettings({
			mode: mode.value,
			cattr: cattr.value,
			sourceTableExpanded: expand.value,
		}),
	);
}

function setMode(value: unknown) {
	if ((value === "log_dice" || value === "coll_freq") && value !== mode.value) {
		mode.value = value;
		emitSettings();
	}
}

function setCattr(value: unknown) {
	if ((value === "lemma" || value === "word" || value === "lempos") && value !== cattr.value) {
		cattr.value = value;
		emitSettings();
	}
}

function setSourceTableExpanded(value: boolean) {
	if (value === expand.value) return;
	expand.value = value;
	emitSettings();
}

function parseCollocations(
	query: CorpusQuery,
	data: CollxResponse | null | undefined,
): Array<CollocationEntry> {
	return (
		data?.Items?.map((item) => {
			const d = item.Stats?.find(({ n }) => n === "d");
			const m = item.Stats?.find(({ n }) => n === "m");
			const tStat = item.Stats?.find(({ n }) => n === "t");
			const logDice = d?.s ? Number(d.s) : -1;
			return {
				word: item.str ?? "",
				freq: item.freq ?? 0,
				coll_freq: item.coll_freq ?? 0,
				d: logDice,
				m: m?.s ? Number(m.s) : -1,
				t: tStat?.s ? Number(tStat.s) : -1,
				name: item.str ?? "",
				weight: logDice,
				color: query.color,
			};
		}) ?? []
	);
}

function getCollocationWeight(
	entry: CollocationEntry,
	selectedMode: CollocationVisualizationSettings["mode"],
) {
	return selectedMode === "log_dice" ? entry.d : entry.coll_freq;
}

const collocationParams = computed(() => ({
	cattr: cattr.value,
	cfromw: -5,
	ctow: 5,
	cminfreq: 9,
	cminbgr: 9,
	cbgrfns: "dmt",
	csortfn: "d" as const,
	citemsperpage: 10,
}));
const queryDescriptors = computed<Array<NoskeCollxQueryDescriptor>>(() =>
	queries.value.map((query) => {
		const facetedQuery = getQueryWithFacetting(query);
		const queryKey = [
			"get-collocations",
			query.noske,
			query.corpus,
			query.subCorpus,
			collocationParams.value,
			JSON.stringify(facetedQuery),
		] as const;
		return {
			queryKey,
			noske: query.noske ?? "",
			enabled: !usesProvidedData.value && Boolean(query.noske),
			params: {
				corpname: query.corpus,
				usesubcorp: query.subCorpus || undefined,
				...collocationParams.value,
				json: JSON.stringify({ concordance_query: facetedQuery }),
			},
		};
	}),
);

const queryResults = useNoskeCollxQueries(queryDescriptors);
const rawData = computed(() =>
	usesProvidedData.value
		? queries.value.map((_, index) => props.data?.[index])
		: queryResults.value.map((result) => result.data),
);
const collocations = computed(() =>
	queries.value.map((query, index) => parseCollocations(query, rawData.value[index])),
);
const sortedCollocations = computed(() =>
	collocations.value.map((entries) =>
		[...entries].sort(
			(a, b) => getCollocationWeight(b, mode.value) - getCollocationWeight(a, mode.value),
		),
	),
);
const collocationsLoading = computed(() =>
	usesProvidedData.value
		? queries.value.map(() => false)
		: queryResults.value.map(
				(result) =>
					!result.isError && (result.data === undefined || result.isFetching || result.isLoading),
			),
);
const collocationErrors = computed(() =>
	queries.value.map((_, index) => {
		if (usesProvidedData.value) return null;
		const result = queryResults.value[index];
		if (!result?.isError) return null;
		return result.data === undefined
			? t("DataDisplayErrors.collocations.loadFailed")
			: t("DataDisplayErrors.collocations.refreshFailed");
	}),
);
const wordClouds = computed(() =>
	collocations.value.map((entries) =>
		entries.map((entry) => ({ ...entry, weight: getCollocationWeight(entry, mode.value) })),
	),
);
</script>

<template>
	<Card :data-collocation-attribute="cattr" :data-collocation-mode="mode">
		<CardHeader v-if="showHeader">
			<CardTitle>{{ t("collocations") }}</CardTitle>
			<CardDescription>{{ t("collocationsDesc") }}</CardDescription>
		</CardHeader>

		<CardContent class="space-y-4">
			<Toolbar class="flex-wrap" :aria-label="t('VisualizationToolbar.collocations')">
				<template v-if="interactive">
					<ToolbarToggleGroup
						class="h-8 rounded-md border border-input bg-background p-0.5 shadow-sm"
						:model-value="mode"
						size="sm"
						type="single"
						:aria-label="t('VisualizationToolbar.frequencyMode')"
						@update:model-value="setMode"
					>
						<ToolbarToggleItem value="log_dice" :aria-label="t('log_dice')">
							<Weight />
						</ToolbarToggleItem>
						<ToolbarToggleItem value="coll_freq" :aria-label="t('coll_freq')">
							<Hash />
						</ToolbarToggleItem>
					</ToolbarToggleGroup>
					<ToolbarSeparator />
					<Select :model-value="cattr" :aria-label="t('cattr')" @update:model-value="setCattr">
						<SelectTrigger id="collocations-cattr" class="h-8 min-w-40">
							<SelectValue :placeholder="t('cattr')" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="lemma">lemma</SelectItem>
							<SelectItem value="word">word</SelectItem>
							<SelectItem value="lempos">lempos</SelectItem>
						</SelectContent>
					</Select>
					<ToolbarSeparator />
				</template>

				<Popover>
					<PopoverTrigger
						class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background"
						:aria-label="t('VisualizationToolbar.queryDetails')"
						type="button"
					>
						<Info />
					</PopoverTrigger>
					<PopoverContent align="end" class="w-80 p-2">
						<QueryDisplay
							v-for="(query, index) of queries"
							:key="query.id"
							:loading="collocationsLoading[index]"
							:query="query"
							:query-key="queryDescriptors[index]?.queryKey"
						/>
					</PopoverContent>
				</Popover>
			</Toolbar>

			<QueryDataStatusList
				:errors="collocationErrors"
				:loading="collocationsLoading"
				:queries="queries"
				@loading-change="emit('loading-change', $event)"
			/>

			<div v-if="collocationErrors.some(Boolean)" class="space-y-2">
				<div
					v-for="(query, index) of queries"
					v-show="collocationErrors[index]"
					:key="query.id"
					class="rounded-md border border-destructive/50 bg-destructive/5 p-3"
				>
					<QueryDisplay class="my-0" :query="query" />
					<p class="mt-1 text-sm text-destructive" role="alert">
						{{ collocationErrors[index] }}
					</p>
				</div>
			</div>

			<div v-for="(query, index) of queries" :key="query.id">
				<WordCloudGraph
					v-if="!collocationsLoading[index]"
					:color="query.color"
					:query-label="query.userInput"
					:title="t('collocationsTitle', { mode: t(mode), query: query.userInput })"
					:words="wordClouds[index] ?? []"
				/>
			</div>
		</CardContent>

		<Collapsible v-if="showSourceData" :open="expand" @update:open="setSourceTableExpanded">
			<CollapsibleContent class="px-6 pb-6">
				<DataDisplaySourceTable
					:data="sortedCollocations"
					datatype="collocations"
					:loading="collocationsLoading"
					:queries="queries"
				/>
			</CollapsibleContent>
		</Collapsible>
		<Separator v-if="showSourceData" />
		<CardFooter v-if="showSourceData && interactive">
			<Toolbar :aria-label="t('VisualizationToolbar.sourceData')">
				<ToolbarButton
					:aria-label="!expand ? t('ShowData') : t('HideData')"
					:aria-pressed="expand"
					type="button"
					variant="outline"
					@click="setSourceTableExpanded(!expand)"
				>
					<Rows3 />
				</ToolbarButton>
			</Toolbar>
		</CardFooter>
	</Card>
</template>
