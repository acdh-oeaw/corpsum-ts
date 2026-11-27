import { createHash } from "node:crypto";

import { setHeader, type H3Event } from "h3";

import type { NoskeDocument } from "~/server/models/noskeinstances.schema";
import {
	NoskeQueryCacheModel,
	type NoskeQueryCacheDocument,
} from "~/server/models/noskequerycache.schema";
import type { AuthenticatedUser } from "~/server/utils/user";

export const noskeCacheHeaders = {
	cache: "X-Corpsum-Cache",
	cacheKey: "X-Corpsum-Cache-Key",
	cachedAt: "X-Corpsum-Cache-Cached-At",
	fetchedAt: "X-Corpsum-Cache-Fetched-At",
	noske: "X-Corpsum-Cache-Noske",
	upstreamDurationMs: "X-Corpsum-Upstream-Duration-Ms",
} as const;

export interface NoskeCacheIdentity {
	cacheKey: string;
	method: string;
	path: string;
	params: unknown;
	body: unknown;
}

export function isNoskeCacheRefresh(headers: Record<string, string | undefined>) {
	return headers["x-corpsum-cache-mode"] === "refresh";
}

export function isNoskeCacheEligible(path: string) {
	return path.startsWith("/search/");
}

export function createNoskeCacheIdentity(input: {
	userId: string;
	noskeId: string;
	method: string;
	path: string;
	params: unknown;
	body: unknown;
}): NoskeCacheIdentity {
	const method = input.method.toUpperCase();
	const params = normalizeForCache(input.params);
	const body = normalizeForCache(input.body);
	const payload = {
		userId: input.userId,
		noskeId: input.noskeId,
		method,
		path: input.path,
		params,
		body,
	};

	return {
		cacheKey: createHash("sha256").update(stableStringify(payload)).digest("hex"),
		method,
		path: input.path,
		params,
		body,
	};
}

export async function findNoskeCachedResponse(input: {
	user: AuthenticatedUser;
	noske: NoskeDocument;
	cacheKey: string;
}) {
	return await NoskeQueryCacheModel.findOneAndUpdate(
		{
			user: input.user._id,
			noske: input.noske._id,
			cacheKey: input.cacheKey,
		},
		{ $inc: { hitCount: 1 } },
		{ new: true },
	);
}

export async function saveNoskeCachedResponse(input: {
	user: AuthenticatedUser;
	noske: NoskeDocument;
	identity: NoskeCacheIdentity;
	data: unknown;
	upstreamDurationMs: number;
	fetchedAt: Date;
}) {
	const cachedAt = new Date();
	return await NoskeQueryCacheModel.findOneAndUpdate(
		{
			user: input.user._id,
			noske: input.noske._id,
			cacheKey: input.identity.cacheKey,
		},
		{
			$set: {
				method: input.identity.method,
				path: input.identity.path,
				params: input.identity.params,
				body: input.identity.body,
				data: input.data,
				fetchedAt: input.fetchedAt,
				cachedAt,
				upstreamDurationMs: input.upstreamDurationMs,
			},
			$setOnInsert: {
				user: input.user._id,
				noske: input.noske._id,
				hitCount: 0,
			},
		},
		{ new: true, upsert: true },
	);
}

export function setNoskeCacheHeaders(input: {
	event: H3Event;
	status: "hit" | "miss" | "refresh" | "skip";
	cacheKey?: string;
	noskeId?: string;
	record?: Pick<NoskeQueryCacheDocument, "cachedAt" | "fetchedAt" | "upstreamDurationMs">;
}) {
	setHeader(input.event, noskeCacheHeaders.cache, input.status);
	if (input.cacheKey) {
		setHeader(input.event, noskeCacheHeaders.cacheKey, input.cacheKey);
	}
	if (input.noskeId) {
		setHeader(input.event, noskeCacheHeaders.noske, input.noskeId);
	}
	if (input.record) {
		setHeader(input.event, noskeCacheHeaders.cachedAt, input.record.cachedAt.toISOString());
		setHeader(input.event, noskeCacheHeaders.fetchedAt, input.record.fetchedAt.toISOString());
		setHeader(
			input.event,
			noskeCacheHeaders.upstreamDurationMs,
			String(input.record.upstreamDurationMs),
		);
	}
}

function normalizeForCache(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map((item) => normalizeForCache(item));
	}
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value)
				.filter(([, entryValue]) => typeof entryValue !== "undefined")
				.sort(([left], [right]) => left.localeCompare(right))
				.map(([key, entryValue]) => [key, normalizeForCache(entryValue)]),
		);
	}
	return value ?? null;
}

function stableStringify(value: unknown): string {
	return JSON.stringify(normalizeForCache(value));
}
