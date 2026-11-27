import { clearAuth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
	await clearAuth(event);
	return;
});
