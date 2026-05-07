import { defineEventHandler, getRouterParam, type H3Event, readBody } from "h3";
import mongoose from "mongoose";

import { type QueryDocument, QueryModel } from "~/server/models/queries.schema";
import { requireReadableNoske } from "~/server/utils/noske";
import { requireUser } from "~/server/utils/user";

interface QueryResponse {
	_id: string;
	name: string;
	owner: Array<Owner>;
	noske: string;
	corpus: string;
	subCorpus: string;
	type: "charrow" | "cqlrow" | "iqueryrow" | "lemmarow" | "phraserow" | "wordrow";
	userInput: string;
	facettingValues: unknown;
}

interface Owner {
	_id: string;
	username: string;
}

interface QueryRecord {
	_id: { toString: () => string };
	name: unknown;
	owner?: ReadonlyArray<
		{ _id: { toString: () => string }; username?: unknown } | { toString: () => string }
	>;
	noske: { toString: () => string };
	corpus: unknown;
	subCorpus: unknown;
	type: unknown;
	userInput: unknown;
	facettingValues: unknown;
}

const queryTypes = ["charrow", "cqlrow", "iqueryrow", "lemmarow", "phraserow", "wordrow"] as const;
const queryTypeSet = new Set<string>(queryTypes);
type QueryOwner = NonNullable<QueryRecord["owner"]>[number];
const readBodySafe = readBody as (event: H3Event) => Promise<unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isQueryType(value: unknown): value is QueryResponse["type"] {
	return typeof value === "string" && queryTypeSet.has(value);
}

function toOwnerId(owner: QueryOwner): string {
	if ("_id" in owner) {
		return owner._id.toString();
	}
	return owner.toString();
}

function toResponse(query: QueryRecord): QueryResponse {
	const owners = query.owner ?? [];
	const ownerList: Array<Owner> = owners.map((owner) => {
		if (typeof (owner as { username?: unknown }).username === "string" && "_id" in owner) {
			const ownerRecord = owner as { _id: { toString: () => string }; username: string };
			return { _id: ownerRecord._id.toString(), username: ownerRecord.username };
		}
		return { _id: toOwnerId(owner), username: "" };
	});
	const type = isQueryType(query.type) ? query.type : "wordrow";
	return {
		_id: query._id.toString(),
		name: String(query.name),
		owner: ownerList,
		noske: query.noske.toString(),
		corpus: String(query.corpus),
		subCorpus: String(query.subCorpus),
		type,
		userInput: String(query.userInput),
		facettingValues: query.facettingValues,
	};
}

export default defineEventHandler(async (event): Promise<QueryResponse | undefined> => {
	const user = await requireUser(event);
	const id = getRouterParam(event, "id");

	if (!id || !mongoose.isValidObjectId(id)) {
		setResponseStatus(event, 400, "invalid id");
		return;
	}

	const query = await QueryModel.findById(id);
	if (!query) {
		setResponseStatus(event, 404, "query not found");
		return;
	}

	const owners = query.owner as Array<{ toString: () => string }> | null | undefined;
	if (!owners) {
		setResponseStatus(event, 500, "owner lookup failed");
		return;
	}
	const isOwner = owners.some((ownerId) => ownerId.toString() === user._id.toString());
	if (!isOwner && user.accounttype !== "admin") {
		setResponseStatus(event, 403, "forbidden");
		return;
	}

	const payload = await readBodySafe(event);
	if (!isRecord(payload)) {
		setResponseStatus(event, 400, "invalid payload");
		return;
	}

	const updates: Partial<QueryDocument> = {};

	if (Object.prototype.hasOwnProperty.call(payload, "name")) {
		if (typeof payload.name !== "string") {
			setResponseStatus(event, 400, "invalid name");
			return;
		}
		updates.name = payload.name;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "noske")) {
		if (typeof payload.noske !== "string") {
			setResponseStatus(event, 400, "invalid noske");
			return;
		}
		const noskeinstance = await requireReadableNoske(payload.noske, user);
		updates.noske = noskeinstance._id;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "corpus")) {
		if (typeof payload.corpus !== "string") {
			setResponseStatus(event, 400, "invalid corpus");
			return;
		}
		updates.corpus = payload.corpus;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "subCorpus")) {
		if (typeof payload.subCorpus !== "string") {
			setResponseStatus(event, 400, "invalid subCorpus");
			return;
		}
		updates.subCorpus = payload.subCorpus;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "type")) {
		if (!isQueryType(payload.type)) {
			setResponseStatus(event, 400, "invalid type");
			return;
		}
		updates.type = payload.type;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "userInput")) {
		if (typeof payload.userInput !== "string") {
			setResponseStatus(event, 400, "invalid userInput");
			return;
		}
		updates.userInput = payload.userInput;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "facettingValues")) {
		updates.facettingValues = payload.facettingValues;
	}

	if (Object.keys(updates).length === 0) {
		setResponseStatus(event, 400, "no fields to update");
		return;
	}

	Object.assign(query, updates);
	await query.save();
	await query.populate<{ owner: Array<{ _id: string; username: string }> }>("owner", "username");

	return toResponse(query as unknown as QueryRecord);
});
