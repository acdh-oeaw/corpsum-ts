import { colors } from "@/utils/colors";
import type { QueryListItem } from "~/server/api/queries.get.ts";

const keyToKey: Record<CorpusQueryType, CorpusQueryTypeValue> = {
	charrow: "char",
	cqlrow: "cql",
	iquery: "iquery",
	lemmarow: "lemma",
	phraserow: "phrase",
	wordrow: "word",
};

function buildFinalQuery(type: CorpusQueryType, userInput: string) {
	switch (type) {
		case "wordrow":
			return `[word="${userInput}"]`;
		case "lemmarow":
			return `[lemma="${userInput}"]`;
		case "cqlrow":
			return userInput;
		case "charrow":
		case "iquery":
		case "phraserow":
			return `[word="${userInput}"]`;
	}
}

export function useCorpusQueryBuilder() {
	const queryStore = useQueryStore();

	function buildCorpusQuery(item: QueryListItem, index: number): CorpusQuery {
		const finalQuery = buildFinalQuery(item.type, item.userInput);
		const concordance_query = {
			queryselector: item.type,
			[keyToKey[item.type]]: item.userInput,
		} as ConcordanceQuery;

		return {
			id: index,
			noske: item.noske,
			type: item.type,
			userInput: item.userInput,
			finalQuery,
			preparedQuery: `aword,${finalQuery}`,
			color: colors[index % colors.length] ?? "#111827",
			showPicker: false,
			corpus: item.corpus,
			subCorpus: item.subCorpus,
			concordance_query,
			KWICAttrsStructs: {
				attributes: [],
				structures: [...queryStore.fixedKWICStructures],
			},
			KWICAttrsStructsOptions: {
				attributes: [],
				structures: [],
			},
			KWICAdditionalViewHeaders: [],
			facettingValues: {},
			SampleRatio: 100,
			loading: {
				yearlyFrequencies: false,
				wordFormFrequencies: false,
				regionalFrequencies: false,
				keywordInContext: false,
				mediaSources: false,
				collocations: false,
			},
		};
	}

	return {
		buildCorpusQuery,
	};
}
