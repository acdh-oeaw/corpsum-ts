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

interface NoskeFetchError {
	message?: unknown;
	status?: unknown;
	statusCode?: unknown;
	statusMessage?: unknown;
	statusText?: unknown;
	data?: unknown;
	response?: {
		status?: unknown;
		statusText?: unknown;
		_data?: unknown;
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function logNoskeApiError({
	error,
	instanceId,
	method,
	path,
	params,
	body,
	durationMs,
	version,
}: {
	error: unknown;
	instanceId: string;
	method: string;
	path: string;
	params: unknown;
	body: unknown;
	durationMs: number;
	version: string;
}) {
	const details: NoskeFetchError = isRecord(error) ? error : {};
	const response = isRecord(details.response) ? details.response : {};

	console.error("[NoSkE proxy] upstream request failed", {
		instanceId,
		version,
		method,
		path,
		status: response.status ?? details.status ?? details.statusCode,
		statusText: response.statusText ?? details.statusText ?? details.statusMessage,
		message: details.message,
		responseData: response._data ?? details.data,
		params,
		body,
		durationMs,
	});
}

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const routeParam = event.context.params?.engine ?? "";
	const [instanceId = "", ...targetSegments] = routeParam.split("/").filter(Boolean);
	const noske = await requireReadableNoske(instanceId, user);
	let authheader: string | undefined;

	const method = event.method ?? "GET";
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
		let data: unknown;
		try {
			data = await fetcher(upstreamPath, {
				headers: proxyHeaders,
				baseURL: noske.base,
				method,
				params,
				body,
			});
		} catch (error) {
			logNoskeApiError({
				error,
				instanceId,
				version: noske.version,
				method,
				path: upstreamPath,
				params,
				body,
				durationMs: Math.round(performance.now() - startedAt),
			});
			throw error;
		}
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

	const startedAt = performance.now();
	try {
		return await fetcher(upstreamPath, {
			headers: proxyHeaders,
			baseURL: noske.base,
			method,
			params,
			body,
		});
	} catch (error) {
		logNoskeApiError({
			error,
			instanceId,
			version: noske.version,
			method,
			path: upstreamPath,
			params,
			body,
			durationMs: Math.round(performance.now() - startedAt),
		});
		throw error;
	}
});
