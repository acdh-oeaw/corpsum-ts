import { computed, toValue, type MaybeRefOrGetter } from "vue";

import type {
	CorpusMetadataMappingLookupResponse,
	CorpusMetadataMappingResponse,
	CorpusMetadataSemantic,
} from "@/lib/visualization-types";

interface CorpusMetadataMappingLookupEntry {
	key: string;
	query: CorpusQuery;
	lookup: CorpusMetadataMappingLookupResponse;
}

export function createCorpusMetadataMappingKey(
	query: Pick<CorpusQuery, "corpus" | "noske">,
	semantic: CorpusMetadataSemantic,
) {
	return `${semantic}:${query.noske ?? ""}:${query.corpus}`;
}

export async function useCorpusMetadataMappings(
	queries: MaybeRefOrGetter<Array<CorpusQuery>>,
	semantic: MaybeRefOrGetter<CorpusMetadataSemantic>,
) {
	const activeQueries = computed(() => toValue(queries));
	const activeSemantic = computed(() => toValue(semantic));
	const uniqueMappingQueries = computed(() => {
		const seen = new Set<string>();
		return activeQueries.value.filter((query) => {
			if (!query.noske || !query.corpus) return false;
			const key = createCorpusMetadataMappingKey(query, activeSemantic.value);
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	});
	const lookupKey = computed(() =>
		uniqueMappingQueries.value
			.map((query) => createCorpusMetadataMappingKey(query, activeSemantic.value))
			.sort()
			.join("|"),
	);

	const { data, refresh } = await useAsyncData<Array<CorpusMetadataMappingLookupEntry>>(
		() => `corpus-metadata-mappings:${activeSemantic.value}:${lookupKey.value}`,
		async () => {
			const requestFetch = import.meta.server ? (useRequestFetch() as typeof $fetch) : $fetch;
			return Promise.all(
				uniqueMappingQueries.value.map(async (query) => ({
					key: createCorpusMetadataMappingKey(query, activeSemantic.value),
					query,
					lookup: await requestFetch<CorpusMetadataMappingLookupResponse>(
						"/api/corpus-metadata-mappings",
						{
							query: {
								noske: query.noske,
								corpus: query.corpus,
								semantic: activeSemantic.value,
							},
						},
					),
				})),
			);
		},
		{
			default: () => [],
			watch: [lookupKey],
		},
	);

	const mappingLookupsByKey = computed(() =>
		Object.fromEntries(data.value.map((entry) => [entry.key, entry.lookup])),
	);
	const mappingsForQueries = computed<Array<CorpusMetadataMappingResponse | null>>(() =>
		activeQueries.value.map((query) => {
			const key = createCorpusMetadataMappingKey(query, activeSemantic.value);
			return mappingLookupsByKey.value[key]?.resolved ?? null;
		}),
	);
	const missingMappingQueries = computed(() =>
		activeQueries.value.filter((_, index) => !mappingsForQueries.value[index]),
	);

	return {
		mappingLookupsByKey,
		mappingsForQueries,
		missingMappingQueries,
		refreshMappings: refresh,
		uniqueMappingQueries,
	};
}
