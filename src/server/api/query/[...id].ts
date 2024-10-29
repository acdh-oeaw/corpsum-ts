import mongoose from "mongoose";

export default defineEventHandler(async (event) => {
	const payload = await requireAuth(event);
	const id = getRouterParam(event, "id");

	return {
		...payload,
	};
});
