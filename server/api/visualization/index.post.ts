import { defineEventHandler, type H3Event, readBody } from "h3";
import mongoose from "mongoose";

import {
	type VisualizationType,
	isVisualizationType,
	normalizeVisualizationType,
} from "~/lib/visualization-types";
import { QueryModel } from "~/server/models/queries.schema";
import { UserModel } from "~/server/models/users.schema";
import {
	type VisualizationDocument,
	VisualizationModel,
} from "~/server/models/visualizations.schema";
import { requireAuth } from "~/server/utils/auth";
const readBodySafe = readBody as (event: H3Event) => Promise<unknown>;

interface VisualizationResponse {
	_id: string;
	name: string;
	queries: Array<string>;
	visualizations: Array<VisualizationType>;
	settings: Array<unknown>;
	data: Array<unknown>;
	createdAt: string | null;
	updatedAt: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function toResponse(record: VisualizationDocument): VisualizationResponse {
	return {
		_id: record._id.toString(),
		name: record.name satisfies string,
		queries: record.queries.map((queryId) => queryId.toString()),
		visualizations: record.visualizations.map((value) => normalizeVisualizationType(value)),
		settings: [...record.settings],
		data: [...record.data],
		createdAt: record.createdAt ? record.createdAt.toISOString() : null,
		updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
	};
}

export default defineEventHandler(async (event): Promise<VisualizationResponse | undefined> => {
	const { username } = await requireAuth(event);

	const user = await UserModel.findOne({ username });
	if (!user) {
		setResponseStatus(event, 500, "authentication error");
		return;
	}

	const payload = await readBodySafe(event);
	if (!isRecord(payload)) {
		setResponseStatus(event, 400, "invalid payload");
		return;
	}

	const { name, queries, visualizations, settings, data } = payload;

	if (typeof name !== "string") {
		setResponseStatus(event, 400, "invalid name");
		return;
	}

	if (
		!Array.isArray(queries) ||
		queries.length === 0 ||
		!queries.every((id) => typeof id === "string" && mongoose.isValidObjectId(id))
	) {
		setResponseStatus(event, 400, "invalid queries");
		return;
	}

	if (
		!Array.isArray(visualizations) ||
		!visualizations.every((item) => isVisualizationType(item))
	) {
		setResponseStatus(event, 400, "invalid visualizations");
		return;
	}

	if (!Array.isArray(settings)) {
		setResponseStatus(event, 400, "invalid settings");
		return;
	}

	if (!Array.isArray(data)) {
		setResponseStatus(event, 400, "invalid data");
		return;
	}

	if ((user.accounttype satisfies string) !== "admin") {
		const ownedCount = await QueryModel.countDocuments({
			_id: { $in: queries },
			owner: user._id,
		});
		if (ownedCount !== queries.length) {
			setResponseStatus(event, 403, "forbidden");
			return;
		}
	}

	const visualization = (await VisualizationModel.create({
		name,
		queries,
		visualizations,
		settings,
		data,
	})) as unknown as VisualizationDocument;

	return toResponse(visualization);
});
