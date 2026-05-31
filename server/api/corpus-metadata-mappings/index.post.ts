import { defineEventHandler, type H3Event, readBody } from "h3";
import mongoose from "mongoose";

import {
	type CorpusMetadataMappingDocument,
	CorpusMetadataMappingModel,
} from "~/server/models/corpusmetadatamappings.schema";
import {
	readMappingPayload,
	serializeCorpusMetadataMapping,
} from "~/server/utils/corpus-metadata-mappings";
import { canMutateNoske, requireReadableNoske } from "~/server/utils/noske";
import { requireUser } from "~/server/utils/user";

const readBodySafe = readBody as (event: H3Event) => Promise<unknown>;

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const payload = readMappingPayload(await readBodySafe(event));
	const noske = await requireReadableNoske(payload.noske, user);

	if (payload.scope === "default" && !canMutateNoske(user, noske)) {
		throw createError({ statusCode: 403, statusMessage: "forbidden" });
	}

	const owner =
		payload.scope === "default"
			? new mongoose.Types.ObjectId(noske.owner.toString())
			: new mongoose.Types.ObjectId(user._id.toString());

	const mapping = (await CorpusMetadataMappingModel.create({
		...payload,
		noske: noske._id,
		owner,
	})) as unknown as CorpusMetadataMappingDocument;

	return serializeCorpusMetadataMapping(mapping);
});
