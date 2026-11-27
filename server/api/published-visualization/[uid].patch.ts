import { defineEventHandler, getRouterParam, type H3Event, readBody } from "h3";

import {
	PublishedVisualizationModel,
	type PublishedVisualizationDocument,
} from "~/server/models/publishedvisualizations.schema";
import { toPublishedVisualizationTombstoneResponse } from "~/server/utils/published-visualization-response";
import { requireUser } from "~/server/utils/user";

const readBodySafe = readBody as (event: H3Event) => Promise<unknown>;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
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

	const isAdmin = (user.accounttype satisfies string) === "admin";
	const isPublisher = published.publisher.toString() === user._id.toString();
	if (!isAdmin && !isPublisher) {
		throw createError({ statusCode: 403, statusMessage: "forbidden" });
	}

	const payload = await readBodySafe(event);
	if (!isRecord(payload) || payload.isPublic !== false) {
		throw createError({ statusCode: 400, statusMessage: "invalid payload" });
	}

	published.isPublic = false;
	published.hiddenAt = new Date();
	published.hiddenBy = user._id;
	await published.save();

	return toPublishedVisualizationTombstoneResponse(published);
});
