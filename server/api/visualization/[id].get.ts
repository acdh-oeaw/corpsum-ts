import { defineEventHandler, getRouterParam } from "h3";
import mongoose from "mongoose";

import { QueryModel } from "~/server/models/queries.schema";
import { UserModel } from "~/server/models/users.schema";
import {
	type VisualizationDocument,
	VisualizationModel,
} from "~/server/models/visualizations.schema";
import { requireAuth } from "~/server/utils/auth";

const visualizationTypes = [
	"data-display-collocations",
	"data-display-keyword-in-context",
	"data-display-media-source",
	"data-display-regional-frequencies",
	"data-display-source-table",
	"data-display-word-form-frequencies",
	"data-display-yearly-frequencies",
] as const;

type VisualizationType = (typeof visualizationTypes)[number];
const visualizationTypeSet = new Set<string>(visualizationTypes);

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

function toVisualizationType(value: unknown): VisualizationType {
	return visualizationTypeSet.has(String(value))
		? (value as VisualizationType)
		: "data-display-keyword-in-context";
}

function toResponse(record: VisualizationDocument): VisualizationResponse {
	return {
		_id: record._id.toString(),
		name: String(record.name),
		queries: record.queries.map((queryId) => queryId.toString()),
		visualizations: record.visualizations.map((value) => toVisualizationType(value)),
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

	if (String(user.accounttype) !== "admin") {
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
