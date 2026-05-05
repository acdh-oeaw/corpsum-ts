import { defineEventHandler, getHeaders, getQuery, readBody } from "h3";

import { decryptCredentialPassword } from "~/server/utils/credentials";
import { requireReadableNoske } from "~/server/utils/noske";
import { requireUser } from "~/server/utils/user";

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const routeParam = event.context.params?.engine ?? "";
	const [instanceId, ...targetSegments] = routeParam.split("/").filter(Boolean);
	const noske = await requireReadableNoske(instanceId, user);
	let authheader: string | undefined;

	const method = event.method;
	const params = getQuery(event);
	const headers = getHeaders(event);

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const body = method === "GET" ? undefined : await readBody(event);

	if (noske.authentication === "basic") {
		const credentials = user.credentials?.find(
			(credential) => credential.noskeinstance.toString() === noske._id.toString(),
		);
		if (!credentials) {
			throw createError({
				statusCode: 401,
				statusMessage: "No credentials configured for this NoSketch instance",
			});
		}
		const password = decryptCredentialPassword(String(credentials.password));
		authheader = `Basic ${btoa(`${String(credentials.username)}:${password}`)}`;
	}

	const targetPath = targetSegments.length > 0 ? `/${targetSegments.join("/")}` : "/";
	const fetcher = $fetch as (input: string, opts: unknown) => Promise<unknown>;
	const proxyHeaders: Record<string, string> = {};

	if (headers["content-type"]) {
		proxyHeaders["Content-Type"] = headers["content-type"];
	}
	if (authheader) {
		proxyHeaders.Authorization = authheader;
	}

	return await fetcher(targetPath, {
		headers: proxyHeaders,
		baseURL: noske.base,
		method,
		params,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		body,
	});
});
