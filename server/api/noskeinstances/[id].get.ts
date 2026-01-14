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

type PopulatedNoskeDocument = NoskeDocumentSlim & { owner: Owner; _id: string };

export default defineEventHandler(async (event): Promise<PopulatedNoskeDocument | undefined> => {
	const { username } = await requireAuth(event);

	const user = await UserModel.findOne({ username });
	if (!user) {
		setResponseStatus(event, 500, "authentication error");
		return;
	}

	const noskeinstance = await NoskeModel.findOne<NoskeDocument>({
		$and: [{ _id: event.context.params?.id }, { $or: [{ public: true }, { owner: user._id }] }],
	}).populate<{ owner: Owner }>("owner", "username");

	if (noskeinstance === null) {
		setResponseStatus(event, 404, "Instance not found");
		return;
	}

	return {
		_id: noskeinstance._id.toString(),
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
	};
});
