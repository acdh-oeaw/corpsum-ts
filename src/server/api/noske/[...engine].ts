import { defineEventHandler, getHeaders, getQuery, readBody } from "h3";

const baseURL = useRuntimeConfig().public.apiBaseUrl;

export default defineEventHandler(async (event) => {
	const method = event.method;
	const params = getQuery(event);
	const { basicAuthString } = await requireAuth(event);

	const headers = getHeaders(event);
	const url = event.node.req.url!;

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const body = method === "GET" ? undefined : await readBody(event);

	return await $fetch(url.split("amc")[1]!, {
		headers: {
			"Content-Type": headers["content-type"]!,
			Authorization: basicAuthString!,
		},
		baseURL,
		method,
		params,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		body,
	});
});
