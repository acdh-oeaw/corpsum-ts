import { defineEventHandler, getRouterParam } from "h3";
import mongoose from "mongoose";

import { type VisualizationType, normalizeVisualizationType } from "~/lib/visualization-types";
import { QueryModel } from "~/server/models/queries.schema";
import { UserModel } from "~/server/models/users.schema";
import {
	type VisualizationDocument,
	VisualizationModel,
} from "~/server/models/visualizations.schema";
import { requireAuth } from "~/server/utils/auth";

export interface VisualizationResponse {
	_id: string;
	name: string;
	queries: Array<string>;
	visualizations: Array<VisualizationType>;
	settings: Array<unknown>;
	data: Array<unknown>;
	createdAt: string | null;
	updatedAt: string | null;
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
	const id = getRouterParam(event, "id");

	if (!id || !mongoose.isValidObjectId(id)) {
		setResponseStatus(event, 400, "invalid id");
		return;
	}

	const user = await UserModel.findOne({ username });
	if (!user) {
		setResponseStatus(event, 500, "authentication error");
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
	const visualization = (await VisualizationModel.findById(id)) as VisualizationDocument | null;
	if (!visualization) {
		setResponseStatus(event, 404, "visualization not found");
		return;
	}

	if ((user.accounttype satisfies string) !== "admin") {
		const ownedCount = await QueryModel.countDocuments({
			_id: { $in: visualization.queries },
			owner: user._id,
		});
		if (ownedCount !== visualization.queries.length) {
			setResponseStatus(event, 403, "forbidden");
			return;
		}
	}

	return toResponse(visualization);
});
