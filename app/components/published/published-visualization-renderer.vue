<script setup lang="ts">
import {
	type CorpusMetadataMappingResponse,
	type TemporalFrequencyDistributionSettings,
	type VisualizationType,
	normalizeTemporalFrequencyDistributionSettings,
	normalizeVisualizationType,
	temporalFrequencyDistributionType,
	visualizationDefinitions,
} from "@/lib/visualization-types";

interface PublishedQuerySnapshot {
	id: number;
	sourceQueryId: string;
	noske: string;
	type: CorpusQueryType;
	userInput: string;
	finalQuery: string;
	preparedQuery: string;
	color: string;
	corpus: string;
	subCorpus: string;
	concordance_query: Record<string, string> & { queryselector: CorpusQueryType };
	facettingValues: unknown;
	KWICAttrsStructs: KWICAttrsStructs;
	SampleRatio: number;
}

interface PublishedPanelSnapshot {
	type: VisualizationType;
	queryId: string;
	data: unknown;
	settings?: unknown;
	mapping?: CorpusMetadataMappingResponse | null;
}

interface PublishedVisualizationSnapshot {
	queries: Array<PublishedQuerySnapshot>;
	visualizations: Array<VisualizationType>;
	panels: Array<PublishedPanelSnapshot>;
}

interface FreqMlItem {
	Word?: Array<{ n?: string }>;
	frq?: number;
	fpm?: number;
	reltt?: number;
}

interface FreqMlResponse {
	Blocks?: Array<{ Items?: Array<FreqMlItem> }>;
}

interface CollxItem {
	str?: string;
	freq?: number;
	coll_freq?: number;
	Stats?: Array<{ n?: string; s?: string }>;
}

interface CollxResponse {
	Items?: Array<CollxItem>;
}

interface ConcordanceLine {
	Tbl_refs?: Array<string>;
	Left?: Array<{ str?: string; strc?: string }>;
	Kwic?: Array<{ str?: string }>;
	Right?: Array<{ str?: string }>;
	toknum?: number;
}

interface ConcordanceResponse {
	Lines?: Array<ConcordanceLine>;
}

const props = defineProps<{ snapshot: PublishedVisualizationSnapshot; embed?: boolean }>();

const t = useTranslations();
const mode = ref<"relative" | "absolute">("relative");

const corpusQueries = computed(() => props.snapshot.queries.map(toCorpusQuery));
const renderItems = computed(() =>
	props.snapshot.visualizations.map((type) => ({
		type: normalizeVisualizationType(type),
		key: visualizationDefinitions[normalizeVisualizationType(type)].searchKey,
	})),
);

function findPanel(type: PublishedPanelSnapshot["type"], queryId: string) {
	return props.snapshot.panels.find(
		(panel) => normalizeVisualizationType(panel.type) === type && panel.queryId === queryId,
	);
}

function toCorpusQuery(query: PublishedQuerySnapshot): CorpusQuery {
	return {
		...query,
		concordance_query: query.concordance_query as ConcordanceQuery,
		facettingValues: query.facettingValues as FacettingValues,
		showPicker: false,
		KWICAttrsStructsOptions: { attributes: [], structures: [] },
		KWICAdditionalViewHeaders: [],
		loading: {
			yearlyFrequencies: false,
			wordFormFrequencies: false,
			regionalFrequencies: false,
			keywordInContext: false,
			mediaSources: false,
			collocations: false,
		},
	};
}

function parseWordFormFrequencies(query: PublishedQuerySnapshot) {
	const data = findPanel("data-display-word-form-frequencies", query.sourceQueryId)?.data as
		| FreqMlResponse
		| undefined;
	return (
		data?.Blocks?.[0]?.Items?.map((item) => ({
			word: item.Word?.[0]?.n ?? "",
			absolute: item.frq ?? 0,
			relative: item.fpm ?? 0,
		})) ?? []
	);
}

function parseMediaSources(query: PublishedQuerySnapshot) {
	const data = findPanel("data-display-media-source", query.sourceQueryId)?.data as
		| FreqMlResponse
		| undefined;
	return (
		data?.Blocks?.[0]?.Items?.map((item) => ({
			media: item.Word?.[0]?.n ?? "",
			absolute: item.frq ?? 0,
			relative: item.reltt ?? 0,
		})) ?? []
	);
}

function parseRegionalFrequencies(query: PublishedQuerySnapshot) {
	const data = findPanel("data-display-regional-frequencies", query.sourceQueryId)?.data as
		| FreqMlResponse
		| undefined;
	return (
		data?.Blocks?.[0]?.Items?.map((item) => ({
			region: item.Word?.[0]?.n ?? "",
			absolute: item.frq ?? 0,
			relative: item.reltt ?? 0,
		})) ?? []
	);
}

function parseYearlyFrequencies(query: PublishedQuerySnapshot) {
	const panel = findPanel(temporalFrequencyDistributionType, query.sourceQueryId);
	const data = panel?.data as FreqMlResponse | undefined;
	const mapping = panel?.mapping;
	const values =
		data?.Blocks?.[0]?.Items?.flatMap((item) => {
			const rawValue = item.Word?.map(({ n }) => n ?? "").join("") ?? "";
			const parsedYear = mapping ? parseTemporalYear(rawValue, mapping) : Number(rawValue);
			if (!Number.isInteger(parsedYear)) return [];
			const year = parsedYear as number;
			return [
				{
					year,
					absolute: item.frq ?? 0,
					relative: item.reltt ?? 0,
				},
			];
		}) ?? [];
	const settings = getTemporalSettings(panel);
	const existing = new Set(values.map(({ year }) => year));
	const missing = Array.from(
		{ length: settings.yearRange.end - settings.yearRange.start + 1 },
		(_, index) => settings.yearRange.start + index,
	)
		.filter((year) => !existing.has(year))
		.map((year) => ({ year, absolute: 0, relative: 0 }));
	return [...values, ...missing].sort((left, right) => left.year - right.year);
}

function parseTemporalYear(
	rawValue: string,
	mapping: CorpusMetadataMappingResponse,
): number | null {
	const normalized = mapping.valueMap?.[rawValue] ?? rawValue;
	if (mapping.parser.mode === "year") {
		const year = Number(normalized);
		return Number.isInteger(year) ? year : null;
	}
	if (mapping.parser.mode === "date") {
		const date = new Date(normalized);
		const year = date.getUTCFullYear();
		return Number.isInteger(year) && !Number.isNaN(date.getTime()) ? year : null;
	}
	if (!mapping.parser.pattern) return null;
	const match = new RegExp(mapping.parser.pattern, "u").exec(normalized);
	const captured = match?.[1] ?? match?.groups?.year;
	if (!captured) return null;
	const year = Number(captured);
	return Number.isInteger(year) ? year : null;
}

function getTemporalSettings(
	panel: PublishedPanelSnapshot | undefined,
): TemporalFrequencyDistributionSettings {
	return normalizeTemporalFrequencyDistributionSettings(panel?.settings);
}

function parseCollocations(query: PublishedQuerySnapshot) {
	const data = findPanel("data-display-collocations", query.sourceQueryId)?.data as
		| CollxResponse
		| undefined;
	return (
		data?.Items?.map((item) => {
			const d = item.Stats?.find(({ n }) => n === "d");
			const m = item.Stats?.find(({ n }) => n === "m");
			const tStat = item.Stats?.find(({ n }) => n === "t");
			return {
				word: item.str ?? "",
				freq: item.freq ?? 0,
				coll_freq: item.coll_freq ?? 0,
				d: d?.s ? Number(d.s) : -1,
				m: m?.s ? Number(m.s) : -1,
				t: tStat?.s ? Number(tStat.s) : -1,
				weight: item.coll_freq ?? 0,
			};
		}) ?? []
	);
}

function parseKwic(query: PublishedQuerySnapshot) {
	const data = findPanel("data-display-keyword-in-context", query.sourceQueryId)?.data as
		| ConcordanceResponse
		| undefined;
	return (
		data?.Lines?.map((line) => ({
			refs: line.Tbl_refs ?? [],
			date: line.Tbl_refs?.[1] ?? "",
			source: line.Tbl_refs?.[3] ?? "",
			region: line.Tbl_refs?.[2] ?? "",
			left: line.Left?.map((entry) => entry.str ?? entry.strc ?? "").join(" ") ?? "",
			word: line.Kwic?.map((entry) => entry.str ?? "").join(" ") ?? "",
			right: line.Right?.map((entry) => entry.str ?? "").join(" ") ?? "",
			docid: line.Tbl_refs?.[0] ?? "",
			toknum: line.toknum ?? 0,
		})) ?? []
	);
}

const mediaSources = computed(() => props.snapshot.queries.map(parseMediaSources));
const regionalFrequencies = computed(() =>
	props.snapshot.queries.map((query) => ({
		query: query.id,
		data: parseRegionalFrequencies(query),
	})),
);
const yearlySeries = computed(() =>
	props.snapshot.queries.map((query) => ({
		color: query.color,
		name: `${query.type}: ${query.userInput} (${query.corpus}${
			query.subCorpus ? ` / ${query.subCorpus})` : ")"
		}`,
		data: parseYearlyFrequencies(query).map(
			(entry) =>
				[entry.year, mode.value === "relative" ? entry.relative : entry.absolute] as [
					number,
					number,
				],
		),
	})),
);
</script>

<template>
	<div class="grid gap-6">
		<div v-if="!embed" class="flex flex-wrap items-center gap-3">
			<ToggleGroup v-model="mode" class="flex" type="single">
				<ToggleGroupItem value="absolute">{{ t("absolute") }}</ToggleGroupItem>
				<ToggleGroupItem value="relative">{{ t("relative") }}</ToggleGroupItem>
			</ToggleGroup>
		</div>

		<Card v-for="{ type, key } in renderItems" :key="type">
			<CardHeader v-if="!embed">
				<CardTitle>{{ t(key) }}</CardTitle>
			</CardHeader>
			<CardContent class="grid gap-4">
				<template v-if="key === 'yearlyFrequencies'">
					<Chart
						chart-type="line"
						class="h-96"
						:series="yearlySeries"
						:title="`${yearlySeries.length} ${t('queries')}`"
						:y-axis="t('sources')"
					/>
				</template>

				<template v-else-if="key === 'wordFormFrequencies'">
					<div v-for="query in snapshot.queries" :key="query.sourceQueryId">
						<QueryDisplay :query="toCorpusQuery(query)" />
						<Chart
							chart-type="bar"
							class="h-96"
							orientation="horizontal"
							:series="[
								{
									color: query.color,
									name: query.userInput,
									data: parseWordFormFrequencies(query).map((entry) => [
										entry.word,
										mode === 'relative' ? entry.relative : entry.absolute,
									]),
								},
							]"
							:title="query.userInput"
						/>
					</div>
				</template>

				<template v-else-if="key === 'mediaSources'">
					<MediaStackedBarChart
						:mode="mode"
						:queries="corpusQueries"
						:source-distributions="mediaSources"
						:stack="true"
					/>
				</template>

				<template v-else-if="key === 'regionalFrequencies'">
					<ClientOnly>
						<CombinedMapChart
							:mode="mode"
							:queries="corpusQueries"
							:resdata="regionalFrequencies"
						/>
					</ClientOnly>
				</template>

				<template v-else-if="key === 'collocations'">
					<div v-for="query in snapshot.queries" :key="query.sourceQueryId">
						<QueryDisplay :query="toCorpusQuery(query)" />
						<WordCloudGraph
							:color="query.color"
							:query-label="query.userInput"
							:title="query.userInput"
							:words="parseCollocations(query)"
						/>
					</div>
				</template>

				<template v-else-if="key === 'keywordInContext'">
					<div v-for="query in snapshot.queries" :key="query.sourceQueryId" class="grid gap-2">
						<QueryDisplay :query="toCorpusQuery(query)" />
						<div class="overflow-x-auto rounded-md border">
							<table class="w-full text-sm">
								<thead>
									<tr class="border-b bg-muted/40 text-left">
										<th class="px-3 py-2">Date</th>
										<th class="px-3 py-2">Source</th>
										<th class="px-3 py-2">Left</th>
										<th class="px-3 py-2">KWIC</th>
										<th class="px-3 py-2">Right</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="(line, index) in parseKwic(query)" :key="index" class="border-b">
										<td class="px-3 py-2">{{ line.date }}</td>
										<td class="px-3 py-2">{{ line.source }}</td>
										<td class="px-3 py-2">{{ line.left }}</td>
										<td class="px-3 py-2 font-semibold">{{ line.word }}</td>
										<td class="px-3 py-2">{{ line.right }}</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</template>

				<template v-else>
					<div class="overflow-x-auto rounded-md border">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b bg-muted/40 text-left">
									<th class="px-3 py-2">Query</th>
									<th class="px-3 py-2">Corpus</th>
									<th class="px-3 py-2">Subcorpus</th>
									<th class="px-3 py-2">Type</th>
									<th class="px-3 py-2">Input</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="query in snapshot.queries" :key="query.sourceQueryId" class="border-b">
									<td class="px-3 py-2">{{ query.sourceQueryId }}</td>
									<td class="px-3 py-2">{{ query.corpus }}</td>
									<td class="px-3 py-2">{{ query.subCorpus }}</td>
									<td class="px-3 py-2">{{ query.type }}</td>
									<td class="px-3 py-2">{{ query.userInput }}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</template>
			</CardContent>
		</Card>
	</div>
</template>
