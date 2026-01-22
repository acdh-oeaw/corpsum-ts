import { defineEventHandler } from "h3";

import {
	type NoskeDocument,
	type NoskeDocumentSlim,
	NoskeModel,
} from "~/server/models/noskeinstances.schema";
import { UserModel } from "~/server/models/users.schema";
import { requireAuth } from "~/server/utils/auth";

interface Owner {
	_id: string;
	username: string;
}

export type PopulatedNoskeDocument = Omit<NoskeDocumentSlim, "createdAt" | "updatedAt"> & {
	owner: Owner;
	_id: string;
	createdAt: string | null;
	updatedAt: string | null;
};

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
			_id: noskeinstance._id.toString(),
			name: noskeinstance.name,
			public: noskeinstance.public,
			base: noskeinstance.base,
			version: noskeinstance.version,
			host: noskeinstance.host,
			authentication: noskeinstance.authentication,
			createdAt: noskeinstance.createdAt
				? noskeinstance.createdAt.toISOString()
				: null,
			updatedAt: noskeinstance.updatedAt
				? noskeinstance.updatedAt.toISOString()
				: null,
			owner: {
				_id: noskeinstance.owner._id.toString(),
				username: noskeinstance.owner.username,
			},
		}));
	},
);
