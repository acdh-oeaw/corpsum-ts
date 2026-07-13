import { requireAuth, setAuth } from "~/server/utils/auth";
import { getJwtExpirationMs } from "~/server/utils/jwt";

export default defineEventHandler(async (event) => {
	const { username } = await requireAuth(event);

	await setAuth(event, username);

	return {
		username,
		expires: Date.now() + getJwtExpirationMs(),
	};
});
