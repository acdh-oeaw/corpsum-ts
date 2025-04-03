import { defineEventHandler } from "h3";

import { NoskeModel } from "~/server/models/noskeinstances.schema";
import { requireAuth } from "~/server/utils/auth";

interface Owner {
	_id: string;
	username: string;
}

type PopulatedNoskeDocument = NoskeDocument & { owner: Owner };

export default defineEventHandler(
	async (event): Promise<Array<PopulatedNoskeDocument> | undefined> => {
		const { username } = await requireAuth(event);

		const user = await UserModel.findOne({ username });
		if (!user) {
			setResponseStatus(event, 500, "authentication error");
			return;
		}

		return await NoskeModel.find({
			$or: [{ public: true }, { owner: user._id }],
		}).populate<{ owner: Owner }>("owner", "username");
	},
);
