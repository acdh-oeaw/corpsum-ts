import { defineEventHandler, type H3Event, readBody } from "h3";

import { QueryModel, type QueryType } from "~/server/models/queries.schema";
import { requireReadableNoske } from "~/server/utils/noske";
import { requireUser } from "~/server/utils/user";

interface QueryResponse {
	_id: string;
	name: string;
	owner: Array<string>;
	noske: string;
	corpus: string;
	subCorpus: string;
	type: QueryType;
	userInput: string;
	facettingValues: unknown;
}

interface QueryRecord {
	_id: { toString: () => string };
	name: unknown;
	owner?: ReadonlyArray<{ toString: () => string }>;
	noske: { toString: () => string };
	corpus: unknown;
	subCorpus: unknown;
	type: unknown;
	userInput: unknown;
	facettingValues: unknown;
}

type FacettingValues = Array<unknown> | Record<string, unknown> | boolean | number | string | null;

const queryTypes: ReadonlyArray<QueryType> = [
	"charrow",
	"cqlrow",
	"iquery",
	"lemmarow",
	"phraserow",
	"wordrow",
];
const queryTypeSet = new Set<string>(queryTypes);
const readBodySafe = readBody as (event: H3Event) => Promise<unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isQueryType(value: unknown): value is QueryResponse["type"] {
	return typeof value === "string" && queryTypeSet.has(value);
}

function toResponse(query: QueryRecord): QueryResponse {
	const owners = query.owner ?? [];
	const type = isQueryType(query.type) ? query.type : "wordrow";
	return {
		_id: query._id.toString(),
		name: String(query.name),
		owner: owners.map((ownerId) => ownerId.toString()),
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

	const payload = await readBodySafe(event);
	if (!isRecord(payload)) {
		setResponseStatus(event, 400, "invalid payload");
		return;
	}

	const { name, noske, corpus, subCorpus, type, userInput } = payload;
	const facettingValues = payload.facettingValues as FacettingValues | undefined;
	if (
		typeof name !== "string" ||
		typeof corpus !== "string" ||
		typeof subCorpus !== "string" ||
		typeof userInput !== "string" ||
		typeof noske !== "string" ||
		!isQueryType(type) ||
		facettingValues === undefined
	) {
		setResponseStatus(event, 400, "invalid type");
		return;
	}
	const noskeinstance = await requireReadableNoske(noske, user);

	const query = await QueryModel.create({
		name,
		owner: [user._id],
		noske: noskeinstance._id,
		corpus,
		subCorpus,
		type,
		userInput,
		facettingValues,
	});

	return toResponse(query as unknown as QueryRecord);
});
