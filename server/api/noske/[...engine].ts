import { defineEventHandler, getHeaders, getQuery, readBody } from "h3";

import { decryptCredentialPassword } from "~/server/utils/credentials";
import { requireReadableNoske } from "~/server/utils/noske";
import { resolveNoskeTargetPath } from "~/server/utils/noske-path";
import {
	createNoskeCacheIdentity,
	findNoskeCachedResponse,
	isNoskeCacheEligible,
	isNoskeCacheRefresh,
	saveNoskeCachedResponse,
	setNoskeCacheHeaders,
} from "~/server/utils/noske-query-cache";
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

	const body = method === "GET" ? undefined : await readBody(event);

	if (noske.authentication === "basic") {
		const credentials = user.credentials.find(
			(credential) => credential.noskeinstance.toString() === noske._id.toString(),
		);
		if (!credentials) {
			throw createError({
				statusCode: 401,
				statusMessage: "No credentials configured for this NoSketch instance",
			});
		}
		const password = decryptCredentialPassword(credentials.password);
		authheader = `Basic ${btoa(`${credentials.username}:${password}`)}`;
	}

	const targetPath = targetSegments.length > 0 ? `/${targetSegments.join("/")}` : "/";
	const upstreamPath = resolveNoskeTargetPath(noske.version, targetPath);
	const fetcher = $fetch as (input: string, opts: unknown) => Promise<unknown>;
	const proxyHeaders: Record<string, string> = {};
	const cacheEligible = isNoskeCacheEligible(targetPath);
	const refreshCache = isNoskeCacheRefresh(headers);

	if (headers["content-type"]) {
		proxyHeaders["Content-Type"] = headers["content-type"];
	}
	if (authheader) {
		proxyHeaders.Authorization = authheader;
	}

	if (cacheEligible) {
		const identity = createNoskeCacheIdentity({
			userId: user._id.toString(),
			noskeId: noske._id.toString(),
			method,
			path: upstreamPath,
			params,
			body,
		});

		if (!refreshCache) {
			const cached = await findNoskeCachedResponse({
				user,
				noske,
				cacheKey: identity.cacheKey,
			});
			if (cached) {
				setNoskeCacheHeaders({
					event,
					status: "hit",
					cacheKey: identity.cacheKey,
					noskeId: noske._id.toString(),
					record: cached,
				});
				return cached.data;
			}
		}

		const fetchedAt = new Date();
		const startedAt = performance.now();
		const data = await fetcher(upstreamPath, {
			headers: proxyHeaders,
			baseURL: noske.base,
			method,
			params,
			body,
		});
		const cached = await saveNoskeCachedResponse({
			user,
			noske,
			identity,
			data,
			fetchedAt,
			upstreamDurationMs: Math.round(performance.now() - startedAt),
		});

		setNoskeCacheHeaders({
			event,
			status: refreshCache ? "refresh" : "miss",
			cacheKey: identity.cacheKey,
			noskeId: noske._id.toString(),
			record: cached,
		});

		return data;
	}

	setNoskeCacheHeaders({ event, status: "skip", noskeId: noske._id.toString() });

	return await fetcher(upstreamPath, {
		headers: proxyHeaders,
		baseURL: noske.base,
		method,
		params,
		body,
	});
});
