import { getRouterParam } from "h3";

import { assertObjectId } from "~/server/utils/noske";
import { requireUser } from "~/server/utils/user";

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const instanceId = assertObjectId(getRouterParam(event, "noskeInstanceId"), "instance id");
	const before = user.credentials.length;

	user.credentials = user.credentials.filter(
		(credential) => credential.noskeinstance.toString() !== instanceId,
	);

	if (user.credentials.length === before) {
		throw createError({
			statusCode: 404,
			statusMessage: "credential not found",
		});
	}

	await user.save();

	return { deleted: true };
});
