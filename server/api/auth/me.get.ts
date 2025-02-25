import { requireAuth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
	const payload = await requireAuth(event);

	return {
		...payload,
	};
});
