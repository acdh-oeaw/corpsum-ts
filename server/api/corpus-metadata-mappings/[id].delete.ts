import { defineEventHandler, getRouterParam } from "h3";
import mongoose from "mongoose";

import {
	type CorpusMetadataMappingDocument,
	CorpusMetadataMappingModel,
} from "~/server/models/corpusmetadatamappings.schema";
import { canMutateNoske, requireReadableNoske } from "~/server/utils/noske";
import { isAdmin, requireUser } from "~/server/utils/user";

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
	const canDelete =
		mapping.scope === "default"
			? canMutateNoske(user, noske)
			: mapping.owner?.toString() === user._id.toString() || isAdmin(user);
	if (!canDelete) {
		throw createError({ statusCode: 403, statusMessage: "forbidden" });
	}

	await mapping.deleteOne();
	return { ok: true };
});
