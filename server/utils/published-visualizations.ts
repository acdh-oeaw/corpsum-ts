import { randomUUID } from "node:crypto";

import { type Types } from "mongoose";

import type { KwicQueryOptions, KwicQueryOptionsById } from "@/lib/kwic-query-options";
import {
	type VisualizationType,
	getVisualizationSettingsForType,
	normalizeCollocationVisualizationSettings,
	normalizeVisualizationType,
	temporalFrequencyDistributionType,
	visualizationDefinitions,
} from "@/lib/visualization-types";
import type { CorpusMetadataMappingResponse } from "@/lib/visualization-types";
import { colors } from "@/utils/colors";
import { getConcordanceInputKey } from "@/utils/concordance-query";
import { type NoskeDocument, NoskeModel } from "~/server/models/noskeinstances.schema";
import { NoskeQueryCacheModel } from "~/server/models/noskequerycache.schema";
import { type QueryDocument, QueryModel } from "~/server/models/queries.schema";
import type { UserDocument } from "~/server/models/users.schema";
import type { VisualizationDocument } from "~/server/models/visualizations.schema";
import {
	resolveCorpusMetadataMapping,
	serializeCorpusMetadataMapping,
} from "~/server/utils/corpus-metadata-mappings";
import { resolveNoskeTargetPath } from "~/server/utils/noske-path";
import { createNoskeCacheIdentity } from "~/server/utils/noske-query-cache";

export const publishedSchemaVersion = 2;

export interface PublishedQuerySnapshot {
	id: number;
	sourceQueryId: string;
	noske: string;
	type: QueryDocument["type"];
	userInput: string;
	finalQuery: string;
	preparedQuery: string;
	color: string;
	corpus: string;
	subCorpus: string;
	concordance_query: Record<string, string> & { queryselector: QueryDocument["type"] };
	facettingValues: unknown;
	KWICAttrsStructs: {
		attributes: Array<string>;
		structures: Array<string>;
	};
	SampleRatio: number;
}

export interface PublishedPanelSnapshot {
	type: VisualizationType;
	queryId: string;
	cacheKey: string;
	fetchedAt: string;
	cachedAt: string;
	upstreamDurationMs: number;
	data: unknown;
	settings?: unknown;
	mapping?: CorpusMetadataMappingResponse | null;
}

export interface MissingPublishedCacheEntry {
	type: VisualizationType;
	queryId: string;
	queryName: string;
	cacheKey: string;
}

const fixedKWICStructures = ["doc.id", "doc.datum", "doc.region", "doc.docsrc"];

export function generatePublishedVisualizationUid() {
	return randomUUID().toLowerCase();
}

export async function createPublishedSnapshot(input: {
	visualization: VisualizationDocument;
	publisher: UserDocument & { _id: Types.ObjectId; username: string };
	title: string;
	description: string;
	kwicQueryOptions?: KwicQueryOptionsById;
}) {
	const queries = await loadVisualizationQueries(input.visualization);
	const noskeById = await loadNoskeInstances(queries);
	const querySnapshots = queries.map((query, index) =>
		createQuerySnapshot(query, index, input.kwicQueryOptions?.[query._id.toString()]),
	);
	const missing: Array<MissingPublishedCacheEntry> = [];
	const panels: Array<PublishedPanelSnapshot> = [];

	for (const value of input.visualization.visualizations) {
		const type = normalizeVisualizationType(value);
		if (!visualizationDefinitions[type].publishedPanel) continue;
		for (const query of queries) {
			const noske = noskeById.get(query.noske.toString());
			if (!noske) continue;
			const settings = getVisualizationSettings(input.visualization, type);
			const kwicQueryOptions = input.kwicQueryOptions?.[query._id.toString()];
			const mapping = await getPanelMapping(type, query, input.publisher._id.toString());
			if (type === temporalFrequencyDistributionType && !mapping) {
				missing.push({
					type,
					queryId: query._id.toString(),
					queryName: query.name,
					cacheKey: "missing-corpus-metadata-mapping",
				});
				continue;
			}
			const request = createPanelRequest(
				type,
				query,
				noske,
				input.publisher._id.toString(),
				mapping,
				settings,
				kwicQueryOptions,
			);
			const cached = await NoskeQueryCacheModel.findOne({
				user: input.publisher._id,
				noske: query.noske,
				cacheKey: request.cacheKey,
			});
			if (!cached) {
				missing.push({
					type,
					queryId: query._id.toString(),
					queryName: query.name,
					cacheKey: request.cacheKey,
				});
				continue;
			}
			panels.push({
				type,
				queryId: query._id.toString(),
				cacheKey: cached.cacheKey,
				fetchedAt: cached.fetchedAt.toISOString(),
				cachedAt: cached.cachedAt.toISOString(),
				upstreamDurationMs: cached.upstreamDurationMs,
				data: cached.data,
				settings,
				mapping: mapping ? serializeCorpusMetadataMapping(mapping) : null,
			});
		}
	}

	return { missing, panels, queries: querySnapshots };
}

function createQuerySnapshot(
	query: QueryDocument,
	index: number,
	kwicQueryOptions?: KwicQueryOptions,
): PublishedQuerySnapshot {
	const finalQuery = buildFinalQuery(query.type, query.userInput);
	const concordanceKey = getConcordanceInputKey(query.type);
	return {
		id: index,
		sourceQueryId: query._id.toString(),
		noske: query.noske.toString(),
		type: query.type,
		userInput: query.userInput,
		finalQuery,
		preparedQuery: `aword,${finalQuery}`,
		color: colors[index % colors.length] ?? "#111827",
		corpus: query.corpus,
		subCorpus: query.subCorpus ?? "",
		concordance_query: {
			queryselector: query.type,
			[concordanceKey]: query.userInput,
		},
		facettingValues: query.facettingValues,
		KWICAttrsStructs: {
			attributes: [...(kwicQueryOptions?.attributes ?? [])],
			structures: [...(kwicQueryOptions?.structures ?? fixedKWICStructures)],
		},
		SampleRatio: 100,
	};
}

function buildFinalQuery(type: QueryDocument["type"], userInput: string) {
	switch (type) {
		case "wordrow":
			return `[word="${userInput}"]`;
		case "lemmarow":
			return `[lemma="${userInput}"]`;
		case "cqlrow":
			return userInput;
		case "charrow":
		case "iquery":
		case "phraserow":
			return `[word="${userInput}"]`;
	}
}

async function loadVisualizationQueries(visualization: VisualizationDocument) {
	const queryIds = visualization.queries.map((queryId) => queryId.toString());
	const queries = await QueryModel.find({ _id: { $in: queryIds } });
	const queryById = new Map(queries.map((query) => [query._id.toString(), query]));
	return queryIds.flatMap((queryId) => {
		const query = queryById.get(queryId);
		return query ? [query] : [];
	});
}

async function loadNoskeInstances(queries: Array<QueryDocument>) {
	const noskeIds = [...new Set(queries.map((query) => query.noske.toString()))];
	const noskeInstances = await NoskeModel.find({ _id: { $in: noskeIds } });
	return new Map(noskeInstances.map((noske) => [noske._id.toString(), noske]));
}

function createPanelRequest(
	type: VisualizationType,
	query: QueryDocument,
	noske: NoskeDocument,
	userId: string,
	mapping?: { attribute: string } | null,
	settings?: unknown,
	kwicQueryOptions?: KwicQueryOptions,
) {
	const targetPath = createTargetPath(type);
	const upstreamPath = resolveNoskeTargetPath(noske.version, targetPath);
	const params = createQueryParams(type, query, mapping, settings, kwicQueryOptions);
	return createNoskeCacheIdentity({
		userId,
		noskeId: query.noske.toString(),
		method: "GET",
		path: upstreamPath,
		params,
		body: undefined,
	});
}

function createTargetPath(type: VisualizationType) {
	const targetPath = visualizationDefinitions[type].noskeTargetPath;
	if (!targetPath) {
		throw new Error(`Visualization type ${type} does not have a NoSketch target path.`);
	}
	return targetPath;
}

function createQueryParams(
	type: VisualizationType,
	query: QueryDocument,
	mapping?: { attribute: string } | null,
	settings?: unknown,
	kwicQueryOptions?: KwicQueryOptions,
) {
	const common = {
		corpname: query.corpus,
		usesubcorp: query.subCorpus || undefined,
		json: JSON.stringify({ concordance_query: getQueryWithFacetting(query) }),
	};
	if (type === "data-display-keyword-in-context") {
		const attributes = kwicQueryOptions?.attributes ?? [];
		const structures = kwicQueryOptions?.structures ?? fixedKWICStructures;
		return {
			corpname: query.corpus,
			usesubcorp: query.subCorpus || undefined,
			viewmode: "kwic",
			attrs: attributes.join(","),
			structs: structures.join(","),
			refs: structures.map((structure) => `=${structure}`).join(","),
			pagesize: "1000",
			json: common.json,
			format: "json",
		};
	}
	if (type === "data-display-word-form-frequencies") {
		return { ...common, ml1attr: "word", ml1ctx: "0<0~0>0" };
	}
	if (type === "data-display-media-source") {
		return {
			...common,
			fmaxitems: "5000",
			fpage: "1",
			group: "0",
			showpoc: "1",
			showreltt: "1",
			showrel: "1",
			freqlevel: "1",
			ml1attr: "doc.docsrc",
			ml1ctx: "0~0 > 0",
		};
	}

	if (type === "data-display-media-type") {
		return {
			...common,
			fmaxitems: "5000",
			fpage: "1",
			group: "0",
			showpoc: "1",
			showreltt: "1",
			showrel: "1",
			freqlevel: "1",
			ml1attr: "doc.mediatype",
			ml1ctx: "0~0 > 0",
		};
	}
	if (type === "data-display-regional-frequencies") {
		return {
			...common,
			group: "0",
			showpoc: "1",
			showreltt: "1",
			showrel: "1",
			freqlevel: "1",
			ml1attr: "doc.region",
			ml1ctx: "0~0 > 0",
		};
	}
	if (type === temporalFrequencyDistributionType) {
		return {
			...common,
			group: "0",
			showpoc: "1",
			showreltt: "1",
			showrel: "1",
			freqlevel: "1",
			ml1attr: mapping?.attribute ?? "doc.year",
			ml1ctx: "0~0 > 0",
		};
	}
	const collocationSettings = normalizeCollocationVisualizationSettings(settings);
	return {
		...common,
		cattr: collocationSettings.cattr,
		ctow: "3",
		cminfreq: "9",
		cminbgr: "9",
		cbgrfns: "dmt",
		csortfn: "d",
		citemsperpage: "10",
	};
}

function getVisualizationSettings(
	visualization: VisualizationDocument,
	type: VisualizationType,
): unknown {
	return getVisualizationSettingsForType(
		visualization.visualizations.map(normalizeVisualizationType),
		visualization.settings,
		type,
	);
}

async function getPanelMapping(type: VisualizationType, query: QueryDocument, userId: string) {
	if (type !== temporalFrequencyDistributionType) return null;
	const resolved = await resolveCorpusMetadataMapping({
		noske: query.noske,
		corpus: query.corpus,
		semantic: "temporal",
		userId,
	});
	return resolved.resolved;
}

function getQueryWithFacetting(query: QueryDocument) {
	const result: Record<string, string | Array<string>> = {
		queryselector: query.type,
		[getConcordanceInputKey(query.type)]: query.userInput,
	};
	const facettingValues = query.facettingValues;
	if (!facettingValues || typeof facettingValues !== "object") return result;
	for (const [key, value] of Object.entries(facettingValues)) {
		if (!value) continue;
		if (Array.isArray(value)) {
			if (value.length > 0) result[`sca_${key}`] = value;
		} else if (typeof value === "object" && "key" in value && "value" in value) {
			const entry = value as { key?: unknown; value?: unknown };
			if (typeof entry.key === "string" && typeof entry.value === "string") {
				result[entry.key] = entry.value;
			}
		}
	}
	return result;
}
