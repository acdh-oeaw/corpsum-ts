import { defineEventHandler, getRouterParam } from "h3";
import mongoose from "mongoose";

import { NoskeModel } from "~/server/models/noskeinstances.schema";
import { requireUser } from "~/server/utils/user";

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const id = getRouterParam(event, "id");

	if (!id || !mongoose.isValidObjectId(id)) {
		setResponseStatus(event, 400, "invalid id");
		return;
	}

	const noskeinstance = await NoskeModel.findById<{ owner: { toString: () => string } }>(id);
	if (!noskeinstance) {
		setResponseStatus(event, 404, "instance not found");
		return;
	}

	const ownsInstance = noskeinstance.owner.toString() === user._id.toString();
	if (!ownsInstance && user.accounttype !== "admin") {
		setResponseStatus(event, 403, "forbidden");
		return;
	}

	await NoskeModel.deleteOne({ _id: id });

	return { deleted: true };
});
