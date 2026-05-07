import { defineEventHandler } from "h3";

import { type NoskeDocument, NoskeModel } from "~/server/models/noskeinstances.schema";
import {
	type SerializedNoskeDocument,
	serializeNoskeDocument,
} from "~/server/utils/noske";
import { requireUser } from "~/server/utils/user";

export default defineEventHandler(
	async (event): Promise<Array<SerializedNoskeDocument> | undefined> => {
		const user = await requireUser(event);

		const res = await NoskeModel.find<NoskeDocument>({
			$or: [{ public: true }, { owner: user._id }],
		}).populate<{ owner: { _id: { toString: () => string }; username: string } }>(
			"owner",
			"username",
		);

		return res.map((noskeinstance) => serializeNoskeDocument(noskeinstance));
	},
);

export type PopulatedNoskeDocument = SerializedNoskeDocument;
