import { defineEventHandler } from "h3";

import { type QueryDocument, QueryModel } from "~/server/models/queries.schema";
import { UserModel } from "~/server/models/users.schema";
import { requireAuth } from "~/server/utils/auth";

export interface QueryListItem {
	_id: string;
	name: string;
	owner: Array<Owner>;
	noske: string;
	corpus: string;
	subCorpus: string;
	type: "charrow" | "cqlrow" | "iqueryrow" | "lemmarow" | "phraserow" | "wordrow";
	userInput: string;
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
	updatedAt?: Date;
}

const queryTypes = ["charrow", "cqlrow", "iqueryrow", "lemmarow", "phraserow", "wordrow"] as const;
const queryTypeSet = new Set<string>(queryTypes);
type QueryOwner = NonNullable<QueryRecord["owner"]>[number];

function isQueryType(value: unknown): value is QueryListItem["type"] {
	return typeof value === "string" && queryTypeSet.has(value);
}

function toOwnerId(owner: QueryOwner): string {
	if ("_id" in owner) {
		return owner._id.toString();
	}
	return owner.toString();
}

function toResponse(query: QueryRecord): QueryListItem {
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
		updatedAt: query.updatedAt ? query.updatedAt.toISOString() : "",
	};
}

export default defineEventHandler(async (event): Promise<Array<QueryListItem> | undefined> => {
	const { username } = await requireAuth(event);

	const user = await UserModel.findOne({ username });
	if (!user) {
		setResponseStatus(event, 500, "authentication error");
		return;
	}

	const filter = user.accounttype === "admin" ? {} : { owner: user._id };
	const queries = await QueryModel.find<QueryDocument>(filter).populate<{
		owner: Array<{ _id: string; username: string }>;
	}>("owner", "username");

	return queries.map(toResponse);
});
