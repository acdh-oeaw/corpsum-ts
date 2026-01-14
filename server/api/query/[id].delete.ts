import { defineEventHandler, getRouterParam } from "h3";
import mongoose from "mongoose";

import { QueryModel } from "~/server/models/queries.schema";
import { UserModel } from "~/server/models/users.schema";
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

	const query = await QueryModel.findById(id);
	if (!query) {
		setResponseStatus(event, 404, "query not found");
		return;
	}

	const owners = query.owner;
	const isOwner = owners.some((ownerId) => ownerId.toString() === user._id.toString());
	if (!isOwner && String(user.accounttype) !== "admin") {
		setResponseStatus(event, 403, "forbidden");
		return;
	}

	await QueryModel.deleteOne({ _id: id });

	return { deleted: true };
});
