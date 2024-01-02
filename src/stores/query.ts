import { acceptHMRUpdate, defineStore } from "pinia";
import { type Ref, ref } from "vue";

import { useCorporaStore } from "./corpora";

const keyToKey = {
	charrow: "char",
	cqlrow: "cql",
	iqueryrow: "iquery",
	lemmarow: "lemma",
	phraserow: "phrase",
	wordrow: "word",
};

export const useQuery = defineStore(
	"queryNew",
	() => {
		const nextQueryId = ref(0);
		const queries = ref([]) as Ref<Array<CorpusQuery>>;
		const corporaStore = useCorporaStore();

		function addQuery(userInput: string, type: CorpusQueryType) {
			let finalQuery = "";

			const concordance_query: Partial<ConcordanceQuery> = {};

			// @ts-ignore
			concordance_query[keyToKey[type]] = userInput;
			concordance_query.queryselector = type;

			// for old (regional Frequencies)
			switch (type) {
				case "wordrow":
					finalQuery = `[word="${userInput}"]`;
					break;
				case "lemmarow":
					finalQuery = `[lemma="${userInput}"]`;
					break;
				case "cqlrow":
					finalQuery = userInput;
					break;
				default: // default is word search
					finalQuery = `[word="${userInput}"]`;
			}

			const colorId = nextQueryId.value % colors.length; // so not to overshoot array
			const query: CorpusQuery = {
				id: nextQueryId.value++,
				color: colors[colorId]!,
				type,
				userInput,
				finalQuery,
				corpus: corporaStore.selectedCorpus?.corpname ?? "",
				subCorpus: corporaStore.selectedSubCorpus?.n ?? "",
				concordance_query: concordance_query as ConcordanceQuery,
				preparedQuery: `aword,${finalQuery}`, // note: this is done in the old project, so we do it here too
				showPicker: false,
				data: {
					yearlyFrequencies: [],
					wordFormFrequencies: [],
					regionalFrequencies: [],
					keywordInContext: [],
					mediaSources: [],
				},
				loading: {
					yearlyFrequencies: false,
					wordFormFrequencies: false,
					regionalFrequencies: false,
					keywordInContext: false,
					mediaSources: false,
				},
			};
			queries.value.push(query);
			const foundQuery = queries.value.find((q) => q.id === query.id);
			if (!foundQuery) throw new Error("could not find query");
			return foundQuery;
		}

		return { nextQueryId, queries, addQuery };
	},
	{ persist: { storage: persistedState.localStorage } },
	// { persist: true }
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useQuery, import.meta.hot));
}
