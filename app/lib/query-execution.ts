import type { QueryType } from "~/server/models/queries.schema";

export interface QueryExecutionInput {
	name: string;
	noske: string;
	corpus: string;
	subCorpus: string;
	type: QueryType;
	userInput: string;
	facettingValues: unknown;
}

export type QueryExecutionFields = Omit<QueryExecutionInput, "name">;

function sortValue(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sortValue);
	if (typeof value !== "object" || value === null) return value;
	return Object.fromEntries(
		Object.entries(value)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, entry]) => [key, sortValue(entry)]),
	);
}

export function cloneQueryExecution(input: QueryExecutionInput): QueryExecutionInput {
	return JSON.parse(JSON.stringify(input)) as QueryExecutionInput;
}

export function getQueryExecutionFingerprint(input: QueryExecutionFields) {
	return JSON.stringify(
		sortValue({
			noske: input.noske.trim(),
			corpus: input.corpus.trim(),
			subCorpus: input.subCorpus.trim(),
			type: input.type,
			userInput: input.userInput.trim(),
			facettingValues: input.facettingValues,
		}),
	);
}

export function queryExecutionMatches(left: QueryExecutionFields, right: QueryExecutionFields) {
	return getQueryExecutionFingerprint(left) === getQueryExecutionFingerprint(right);
}
