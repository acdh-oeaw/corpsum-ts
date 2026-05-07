import { defineEventHandler, getRouterParam } from "h3";
import mongoose from "mongoose";

import { type QueryDocument, QueryModel } from "~/server/models/queries.schema";
import { requireUser } from "~/server/utils/user";

export interface QueryResponse {
	_id: string;
	name: string;
	owner: Array<Owner>;
	noske: string;
	corpus: string;
	subCorpus: string;
	type: "charrow" | "cqlrow" | "iqueryrow" | "lemmarow" | "phraserow" | "wordrow";
	userInput: string;
	facettingValues: unknown;
	createdAt: string;
	updatedAt: string;
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
	subCorpus?: unknown;
	type: unknown;
	userInput: unknown;
	facettingValues: unknown;
	createdAt?: Date;
	updatedAt?: Date;
}

const queryTypes = ["charrow", "cqlrow", "iqueryrow", "lemmarow", "phraserow", "wordrow"] as const;
const queryTypeSet = new Set<string>(queryTypes);
type QueryOwner = NonNullable<QueryRecord["owner"]>[number];

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
		createdAt: query.createdAt ? query.createdAt.toISOString() : "",
		updatedAt: query.updatedAt ? query.updatedAt.toISOString() : "",
	};
}

export default defineEventHandler(async (event): Promise<QueryResponse | undefined> => {
	const user = await requireUser(event);
	const id = getRouterParam(event, "id");

	if (!id || !mongoose.isValidObjectId(id)) {
		setResponseStatus(event, 400, "invalid id");
		return;
	}

	const query = await QueryModel.findById<QueryDocument>(id).populate<{
		owner: Array<{ _id: string; username: string }>;
	}>("owner", "username");
	if (!query) {
		setResponseStatus(event, 404, "query not found");
		return;
	}

	const owners = query.owner;
	const ownerIds = owners.map((owner) => toOwnerId(owner));
	const isOwner = ownerIds.some((ownerId) => ownerId === user._id.toString());
	if (!isOwner && user.accounttype !== "admin") {
		setResponseStatus(event, 403, "forbidden");
		return;
	}

	return toResponse(query);
});
