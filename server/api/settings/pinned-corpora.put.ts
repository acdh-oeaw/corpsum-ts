import mongoose from "mongoose";

import { UserModel } from "~/server/models/users.schema";
import { requireReadableNoske } from "~/server/utils/noske";
import { requireUser } from "~/server/utils/user";

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const body: unknown = await readBody(event);
	if (
		!body ||
		typeof body !== "object" ||
		!("instanceId" in body) ||
		!("corpus" in body) ||
		!("pinned" in body) ||
		typeof body.instanceId !== "string" ||
		!mongoose.isValidObjectId(body.instanceId) ||
		typeof body.corpus !== "string" ||
		!body.corpus.trim() ||
		body.corpus.length > 512 ||
		typeof body.pinned !== "boolean"
	)
		throw createError({ statusCode: 400, statusMessage: "Invalid corpus pin" });
	if (body.pinned) await requireReadableNoske(body.instanceId, user);
	const pin = { instanceId: new mongoose.Types.ObjectId(body.instanceId), corpus: body.corpus };
	await UserModel.updateOne(
		{ _id: user._id },
		body.pinned
			? { $addToSet: { "settings.pinnedCorpora": pin } }
			: { $pull: { "settings.pinnedCorpora": pin } },
	);
	return { pinned: body.pinned };
});
