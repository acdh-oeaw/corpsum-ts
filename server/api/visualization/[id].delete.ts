import { defineEventHandler, getRouterParam } from "h3";
import mongoose from "mongoose";

import { QueryModel } from "~/server/models/queries.schema";
import {
	type VisualizationDocument,
	VisualizationModel,
} from "~/server/models/visualizations.schema";
import { requireUser } from "~/server/utils/user";

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const id = getRouterParam(event, "id");

	if (!id || !mongoose.isValidObjectId(id)) {
		setResponseStatus(event, 400, "invalid id");
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
	const visualization = (await VisualizationModel.findById(id)) as VisualizationDocument | null;
	if (!visualization) {
		setResponseStatus(event, 404, "visualization not found");
		return;
	}

	if (user.accounttype !== "admin") {
		const ownedCount = await QueryModel.countDocuments({
			_id: { $in: visualization.queries },
			owner: user._id,
		});
		if (ownedCount !== visualization.queries.length) {
			setResponseStatus(event, 403, "forbidden");
			return;
		}
	}

	await VisualizationModel.deleteOne({ _id: id });
	return { deleted: true };
});
