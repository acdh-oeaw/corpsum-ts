import { acceptHMRUpdate, defineStore } from "pinia";
import { type Ref, ref } from "vue";

import { useCorporaStore } from "./corpora";

export const useQuery = defineStore(
	"query",
	() => {
		const nextQueryId = ref(0);
		const queries = ref([]) as Ref<Array<CorpusQuery>>;
		const corporaStore = useCorporaStore();
		function addQuery(userInput: string, type: CorpusQueryType) {
			let finalQuery = "";
			switch (type) {
				case "word":
					finalQuery = `[word="${userInput}"]`;
					break;
				case "lemma":
					finalQuery = `[lemma="${userInput}"]`;
					break;
				case "lc":
					finalQuery = `[lc="${userInput.toLowerCase()}"]`;
					break;
				case "lc*":
					finalQuery = `[lc=".*${userInput.toLowerCase()}.*"]`;
					break;
				case "custom":
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
