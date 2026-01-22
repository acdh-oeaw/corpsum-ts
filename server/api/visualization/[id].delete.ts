import { defineEventHandler, getRouterParam } from "h3";
import mongoose from "mongoose";

import { QueryModel } from "~/server/models/queries.schema";
import { UserModel } from "~/server/models/users.schema";
import { VisualizationModel } from "~/server/models/visualizations.schema";
import { requireAuth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
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

	const visualization = await VisualizationModel.findById(id);
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

	await VisualizationModel.deleteOne({ _id: id });
	return { deleted: true };
});
