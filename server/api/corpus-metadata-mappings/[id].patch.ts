import { defineEventHandler, getRouterParam, type H3Event, readBody } from "h3";
import mongoose from "mongoose";

import {
	type CorpusMetadataMappingDocument,
	CorpusMetadataMappingModel,
} from "~/server/models/corpusmetadatamappings.schema";
import {
	isRecord,
	isTemporalParser,
	serializeCorpusMetadataMapping,
} from "~/server/utils/corpus-metadata-mappings";
import { canMutateNoske, requireReadableNoske } from "~/server/utils/noske";
import { isAdmin, requireUser } from "~/server/utils/user";

const readBodySafe = readBody as (event: H3Event) => Promise<unknown>;

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const id = getRouterParam(event, "id");
	if (!id || !mongoose.isValidObjectId(id)) {
		throw createError({ statusCode: 400, statusMessage: "invalid id" });
	}

	const mapping = await CorpusMetadataMappingModel.findById<CorpusMetadataMappingDocument>(id);
	if (!mapping) {
		throw createError({ statusCode: 404, statusMessage: "mapping not found" });
	}

	const noske = await requireReadableNoske(mapping.noske.toString(), user);
	const canEdit =
		mapping.scope === "default"
			? canMutateNoske(user, noske)
			: mapping.owner?.toString() === user._id.toString() || isAdmin(user);
	if (!canEdit) {
		throw createError({ statusCode: 403, statusMessage: "forbidden" });
	}

	const payload = await readBodySafe(event);
	if (!isRecord(payload)) {
		throw createError({ statusCode: 400, statusMessage: "invalid payload" });
	}

	if (Object.prototype.hasOwnProperty.call(payload, "attribute")) {
		if (typeof payload.attribute !== "string") {
			throw createError({ statusCode: 400, statusMessage: "invalid attribute" });
		}
		mapping.attribute = payload.attribute;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "parser")) {
		if (!isTemporalParser(payload.parser)) {
			throw createError({ statusCode: 400, statusMessage: "invalid parser" });
		}
		mapping.parser = payload.parser;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "valueMap")) {
		if (!isRecord(payload.valueMap)) {
			throw createError({ statusCode: 400, statusMessage: "invalid value map" });
		}
		if (!Object.values(payload.valueMap).every((entry) => typeof entry === "string")) {
			throw createError({ statusCode: 400, statusMessage: "invalid value map" });
		}
		mapping.valueMap = payload.valueMap as Record<string, string>;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "label")) {
		mapping.label = typeof payload.label === "string" ? payload.label : undefined;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "description")) {
		mapping.description = typeof payload.description === "string" ? payload.description : undefined;
	}

	await mapping.save();
	return serializeCorpusMetadataMapping(mapping);
});
