import { defineEventHandler, getRouterParam } from "h3";
import mongoose from "mongoose";

import { QueryModel } from "~/server/models/queries.schema";
import { requireUser } from "~/server/utils/user";

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const id = getRouterParam(event, "id");

	if (!id || !mongoose.isValidObjectId(id)) {
		setResponseStatus(event, 400, "invalid id");
		return;
	}

	const query = await QueryModel.findById(id);
	if (!query) {
		setResponseStatus(event, 404, "query not found");
		return;
	}

	const owners = query.owner as Array<{ toString: () => string }> | null | undefined;
	if (!owners) {
		setResponseStatus(event, 500, "owner lookup failed");
		return;
	}
	const isOwner = owners.some((ownerId) => ownerId.toString() === user._id.toString());
	if (!isOwner && user.accounttype !== "admin") {
		setResponseStatus(event, 403, "forbidden");
		return;
	}

	await QueryModel.deleteOne({ _id: id });

	return { deleted: true };
});
