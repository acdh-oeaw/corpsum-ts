import { defineEventHandler, getRouterParam, type H3Event, readBody } from "h3";
import mongoose from "mongoose";

import {
	PublishedVisualizationModel,
	type PublishedVisualizationDocument,
} from "~/server/models/publishedvisualizations.schema";
import { QueryModel } from "~/server/models/queries.schema";
import { UserModel } from "~/server/models/users.schema";
import {
	type VisualizationDocument,
	VisualizationModel,
} from "~/server/models/visualizations.schema";
import { requireAuth } from "~/server/utils/auth";
import { toPublishedVisualizationResponse } from "~/server/utils/published-visualization-response";
import {
	createPublishedSnapshot,
	generatePublishedVisualizationUid,
	publishedSchemaVersion,
} from "~/server/utils/published-visualizations";

const readBodySafe = readBody as (event: H3Event) => Promise<unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

async function createWithUniqueUid(input: {
	visualization: VisualizationDocument;
	user: Awaited<ReturnType<typeof UserModel.findOne>> & {
		_id: mongoose.Types.ObjectId;
		username: string;
	};
	title: string;
	description: string;
	queries: Array<unknown>;
	panels: Array<unknown>;
}) {
	for (let attempt = 0; attempt < 5; attempt++) {
		try {
			return (await PublishedVisualizationModel.create({
				uid: generatePublishedVisualizationUid(),
				schemaVersion: publishedSchemaVersion,
				sourceVisualization: input.visualization._id,
				publisher: input.user._id,
				publisherUsername: input.user.username,
				title: input.title,
				description: input.description,
				queries: input.queries,
				visualizations: input.visualization.visualizations,
				panels: input.panels,
				isPublic: true,
				publishedAt: new Date(),
			})) as unknown as PublishedVisualizationDocument;
		} catch (error) {
			if (!(error instanceof mongoose.mongo.MongoServerError) || error.code !== 11000) {
				throw error;
			}
		}
	}

	throw createError({
		statusCode: 500,
		statusMessage: "Could not generate a unique published visualization id",
	});
}

export default defineEventHandler(async (event) => {
	const { username } = await requireAuth(event);
	const id = getRouterParam(event, "id");

	if (!id || !mongoose.isValidObjectId(id)) {
		throw createError({ statusCode: 400, statusMessage: "invalid id" });
	}

	const user = await UserModel.findOne({ username });
	if (!user) {
		throw createError({ statusCode: 500, statusMessage: "authentication error" });
	}

	const visualization = (await VisualizationModel.findById(id)) as VisualizationDocument | null;
	if (!visualization) {
		throw createError({ statusCode: 404, statusMessage: "visualization not found" });
	}

	if ((user.accounttype satisfies string) !== "admin") {
		const ownedCount = await QueryModel.countDocuments({
			_id: { $in: visualization.queries },
			owner: user._id,
		});
		if (ownedCount !== visualization.queries.length) {
			throw createError({ statusCode: 403, statusMessage: "forbidden" });
		}
	}

	const payload = await readBodySafe(event);
	if (!isRecord(payload) || typeof payload.title !== "string") {
		throw createError({ statusCode: 400, statusMessage: "invalid payload" });
	}

	const title = payload.title.trim();
	const description = typeof payload.description === "string" ? payload.description.trim() : "";
	if (!title) {
		throw createError({ statusCode: 400, statusMessage: "invalid title" });
	}

	const snapshot = await createPublishedSnapshot({
		visualization,
		publisher: user as typeof user & { _id: mongoose.Types.ObjectId; username: string },
		title,
		description,
	});

	if (snapshot.missing.length > 0) {
		throw createError({
			statusCode: 409,
			statusMessage: "missing cached visualization data",
			data: { missing: snapshot.missing },
		});
	}

	const published = await createWithUniqueUid({
		visualization,
		user: user as typeof user & { _id: mongoose.Types.ObjectId; username: string },
		title,
		description,
		queries: snapshot.queries,
		panels: snapshot.panels,
	});

	return toPublishedVisualizationResponse(published);
});
