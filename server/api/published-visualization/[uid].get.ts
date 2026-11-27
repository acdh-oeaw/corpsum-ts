import { defineEventHandler, getRouterParam } from "h3";

import {
	PublishedVisualizationModel,
	type PublishedVisualizationDocument,
} from "~/server/models/publishedvisualizations.schema";
import {
	toPublishedVisualizationResponse,
	toPublishedVisualizationTombstoneResponse,
} from "~/server/utils/published-visualization-response";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export default defineEventHandler(async (event) => {
	const uid = getRouterParam(event, "uid");
	if (!uid || !uuidPattern.test(uid)) {
		throw createError({ statusCode: 404, statusMessage: "published visualization not found" });
	}

	const published = (await PublishedVisualizationModel.findOne({
		uid,
	})) as PublishedVisualizationDocument | null;
	if (!published) {
		throw createError({ statusCode: 404, statusMessage: "published visualization not found" });
	}

	if (!published.isPublic) {
		return toPublishedVisualizationTombstoneResponse(published);
	}

	return toPublishedVisualizationResponse(published);
});
