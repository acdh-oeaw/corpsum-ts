import type { H3Event } from "h3";

import type { AuthPayload } from "@/types/server";

const { authSecret } = useRuntimeConfig();

export async function _useSession(event: H3Event, username?: string) {
	const session = await useSession(event, {
		password: authSecret,
		name: "authorization",
	});
	if (username) await session.update({ username });
	return {
		...session,
		data: session.data as AuthPayload,
	};
}
