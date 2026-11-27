import { NoskeModel } from "~/server/models/noskeinstances.schema";
import { requireUser } from "~/server/utils/user";

interface CredentialListItem {
	noskeinstance: string;
	noskeName: string;
	username: string;
}

export default defineEventHandler(async (event): Promise<Array<CredentialListItem>> => {
	const user = await requireUser(event);
	const credentials = user.credentials;
	const instanceIds = credentials.map((credential) => credential.noskeinstance);
	const instances = await NoskeModel.find({ _id: { $in: instanceIds } }).select(["_id", "name"]);
	const instanceNameById = new Map(
		instances.map((instance) => [instance._id.toString(), instance.name]),
	);

	return credentials.map((credential) => {
		const instanceId = credential.noskeinstance.toString();

		return {
			noskeinstance: instanceId,
			noskeName: instanceNameById.get(instanceId) ?? "",
			username: credential.username,
		};
	});
});
