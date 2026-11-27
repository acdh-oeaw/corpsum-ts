import { requireUser } from "~/server/utils/user";

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	return (user.settings?.pinnedCorpora ?? []).map((pin) => ({
		instanceId: pin.instanceId.toString(),
		corpus: pin.corpus,
	}));
});
