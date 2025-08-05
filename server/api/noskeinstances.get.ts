import { defineEventHandler } from "h3";

import { type NoskeDocumentSlim, NoskeModel } from "~/server/models/noskeinstances.schema";
import { requireAuth } from "~/server/utils/auth";

interface Owner {
	_id: string;
	username: string;
}

export type PopulatedNoskeDocument = NoskeDocumentSlim & { owner: Owner; _id: string };

export default defineEventHandler(
	async (event): Promise<Array<PopulatedNoskeDocument> | undefined> => {
		const { username } = await requireAuth(event);

		const user = await UserModel.findOne({ username });
		if (!user) {
			setResponseStatus(event, 500, "authentication error");
			return;
		}

		const res = await NoskeModel.find<NoskeDocument>({
			$or: [{ public: true }, { owner: user._id }],
		}).populate<{ owner: Owner }>("owner", "username");

		return res.map((noskeinstance) => ({
			_id: noskeinstance._id!.toString(),
			name: noskeinstance.name,
			public: noskeinstance.public,
			base: noskeinstance.base,
			version: noskeinstance.version,
			host: noskeinstance.host,
			authentication: noskeinstance.authentication,
			owner: {
				_id: noskeinstance.owner._id.toString(),
				username: noskeinstance.owner.username,
			},
		}));
	},
);
