import { defineEventHandler } from "h3";

import { type NoskeDocument, NoskeModel } from "~/server/models/noskeinstances.schema";
import {
	assertObjectId,
	type SerializedNoskeDocument,
	serializeNoskeDocument,
} from "~/server/utils/noske";
import { requireUser } from "~/server/utils/user";

export default defineEventHandler(async (event): Promise<SerializedNoskeDocument | undefined> => {
	const user = await requireUser(event);
	const id = assertObjectId(event.context.params?.id, "id");

	const noskeinstance = await NoskeModel.findOne<NoskeDocument>({
		$and: [{ _id: id }, { $or: [{ public: true }, { owner: user._id }] }],
	}).populate<{ owner: { _id: { toString: () => string }; username: string } }>(
		"owner",
		"username",
	);

	if (noskeinstance === null) {
		setResponseStatus(event, 404, "Instance not found");
		return;
	}

	return serializeNoskeDocument(noskeinstance);
});
