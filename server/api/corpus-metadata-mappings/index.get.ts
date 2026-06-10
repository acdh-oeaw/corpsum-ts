import { defineEventHandler, getQuery } from "h3";

import { CorpusMetadataMappingModel } from "~/server/models/corpusmetadatamappings.schema";
import {
	isSemantic,
	resolveCorpusMetadataMapping,
	serializeCorpusMetadataMapping,
} from "~/server/utils/corpus-metadata-mappings";
import { canMutateNoske, requireReadableNoske } from "~/server/utils/noske";
import { requireUser } from "~/server/utils/user";

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const query = getQuery(event);
	const noskeId = typeof query.noske === "string" ? query.noske : undefined;
	const corpus = typeof query.corpus === "string" ? query.corpus : "";
	const semantic = query.semantic;
	const scope = query.scope;

	const noske = await requireReadableNoske(noskeId, user);
	if (!corpus) {
		throw createError({ statusCode: 400, statusMessage: "invalid corpus" });
	}
	if (!isSemantic(semantic)) {
		throw createError({ statusCode: 400, statusMessage: "invalid semantic" });
	}

	if (scope === "all") {
		const mappings = await CorpusMetadataMappingModel.find({
			noske: noske._id,
			corpus,
			semantic,
			$or: [{ scope: "default" }, { scope: "user", owner: user._id }],
		});
		return mappings.map(serializeCorpusMetadataMapping);
	}

	const resolved = await resolveCorpusMetadataMapping({
		noske: noske._id,
		corpus,
		semantic,
		userId: user._id,
	});

	return {
		resolved: resolved.resolved ? serializeCorpusMetadataMapping(resolved.resolved) : null,
		user: resolved.user ? serializeCorpusMetadataMapping(resolved.user) : null,
		default: resolved.default ? serializeCorpusMetadataMapping(resolved.default) : null,
		canEditDefault: canMutateNoske(user, noske),
	};
});
