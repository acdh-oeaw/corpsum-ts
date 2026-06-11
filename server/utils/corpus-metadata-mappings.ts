import type { Types } from "mongoose";

import type {
	CorpusMetadataMappingPayload,
	CorpusMetadataMappingResponse,
	CorpusMetadataMappingScope,
	CorpusMetadataSemantic,
	TemporalParserConfig,
} from "@/lib/visualization-types";
import {
	type CorpusMetadataMappingDocument,
	CorpusMetadataMappingModel,
} from "~/server/models/corpusmetadatamappings.schema";

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function isTemporalParser(value: unknown): value is TemporalParserConfig {
	if (!isRecord(value)) return false;
	if (value.mode !== "year" && value.mode !== "date" && value.mode !== "regex") return false;
	if (value.mode === "regex") return typeof value.pattern === "string" && value.pattern.length > 0;
	return value.pattern === undefined || typeof value.pattern === "string";
}

export function isSemantic(value: unknown): value is CorpusMetadataSemantic {
	return value === "temporal";
}

export function isScope(value: unknown): value is CorpusMetadataMappingScope {
	return value === "default" || value === "user";
}

export function readMappingPayload(value: unknown): Omit<CorpusMetadataMappingPayload, "owner"> {
	if (!isRecord(value)) {
		throw createError({ statusCode: 400, statusMessage: "invalid payload" });
	}

	if (
		typeof value.noske !== "string" ||
		typeof value.corpus !== "string" ||
		!isSemantic(value.semantic) ||
		!isScope(value.scope) ||
		typeof value.attribute !== "string" ||
		!isTemporalParser(value.parser)
	) {
		throw createError({ statusCode: 400, statusMessage: "invalid mapping" });
	}

	const valueMap = isRecord(value.valueMap) ? value.valueMap : {};
	if (!Object.values(valueMap).every((entry) => typeof entry === "string")) {
		throw createError({ statusCode: 400, statusMessage: "invalid value map" });
	}

	return {
		noske: value.noske,
		corpus: value.corpus,
		semantic: value.semantic,
		scope: value.scope,
		attribute: value.attribute,
		parser: value.parser,
		valueMap: valueMap as Record<string, string>,
		label: typeof value.label === "string" ? value.label : undefined,
		description: typeof value.description === "string" ? value.description : undefined,
	};
}

export function serializeCorpusMetadataMapping(
	record: CorpusMetadataMappingDocument,
): CorpusMetadataMappingResponse {
	return {
		_id: record._id.toString(),
		noske: record.noske.toString(),
		corpus: record.corpus,
		semantic: record.semantic,
		scope: record.scope,
		owner: record.owner?.toString(),
		attribute: record.attribute,
		parser: record.parser,
		valueMap: record.valueMap ?? {},
		label: record.label,
		description: record.description,
		createdAt: record.createdAt ? record.createdAt.toISOString() : null,
		updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
	};
}

export async function resolveCorpusMetadataMapping(input: {
	noske: string | Types.ObjectId;
	corpus: string;
	semantic: CorpusMetadataSemantic;
	userId: string | Types.ObjectId;
}) {
	const [userMapping, defaultMapping] = await Promise.all([
		CorpusMetadataMappingModel.findOne<CorpusMetadataMappingDocument>({
			noske: input.noske,
			corpus: input.corpus,
			semantic: input.semantic,
			scope: "user",
			owner: input.userId,
		}),
		CorpusMetadataMappingModel.findOne<CorpusMetadataMappingDocument>({
			noske: input.noske,
			corpus: input.corpus,
			semantic: input.semantic,
			scope: "default",
		}),
	]);

	return {
		resolved: userMapping ?? defaultMapping,
		user: userMapping,
		default: defaultMapping,
	};
}
