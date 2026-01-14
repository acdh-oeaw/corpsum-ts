import { defineEventHandler, getRouterParam } from "h3";
import mongoose from "mongoose";

import { NoskeModel } from "~/server/models/noskeinstances.schema";
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

	const noskeinstance = await NoskeModel.findById(id);
	if (!noskeinstance) {
		setResponseStatus(event, 404, "instance not found");
		return;
	}

	const ownsInstance = noskeinstance.owner.toString() === user._id.toString();
	if (!ownsInstance && String(user.accounttype) !== "admin") {
		setResponseStatus(event, 403, "forbidden");
		return;
	}

	await NoskeModel.deleteOne({ _id: id });

	return { deleted: true };
});
