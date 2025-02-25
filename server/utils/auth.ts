import type { H3Event } from "h3";

import { createJWT, verifyJWT } from "~/server/utils/jwt";
import { _useSession } from "~/server/utils/session";

export async function getAuth(event: H3Event) {
	return (await _useSession(event)).data.username;
}

export async function setAuth(event: H3Event, username: string) {
	const token = await createJWT(username);
	return await _useSession(event, token);
}

export async function clearAuth(event: H3Event) {
	return (await _useSession(event)).clear() as Promise<void>;
}

export async function requireAuth(event: H3Event) {
	const token = await getAuth(event);

	if (!token)
		throw createError({
			statusCode: 401,
			statusText: "Unauthorized! token invalid.",
		});

	return await verifyJWT(token);
}
