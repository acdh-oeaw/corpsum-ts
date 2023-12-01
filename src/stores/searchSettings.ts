import { acceptHMRUpdate, defineStore, storeToRefs } from "pinia";
import { type Ref, ref, watch } from "vue";

type SearchFunctionKey =
	| "keywordInContext"
	| "mediaSources"
	| "regionalFrequencies"
	| "wordFormFrequencies"
	| "yearlyFrequencies";

export const useSearchSettingsStore = defineStore(
	"searchSettings",
	() => {
		const { getYearlyFrequencies } = useYearlyFrequenciesSearch();
		const { getWordFormFrequencies } = useWordFormsSearch();
		const { getMediaSourceFrequencies } = useMediaSourceSearch();
		const { getRegionsFrequencies } = useRegionsSearch();
		const { getKeywordInContext } = useKeywordInContextSearch();
		const possibleSearchKeys: Ref<Array<{ value: SearchFunctionKey; title: string }>> = ref([
			{ value: "yearlyFrequencies", title: "Yearly Frequencies" },
			{ value: "wordFormFrequencies", title: "Word Form Frequencies" },
			{ value: "regionalFrequencies", title: "Regional Frequencies" },
			{ value: "mediaSources", title: "Media Sources" },
			{ value: "keywordInContext", title: "Keyword in Context View" },
		]);

		const searchFunctions: Record<SearchFunctionKey, (query: CorpusQuery) => void> = {
			// eslint-disable-next-line
			yearlyFrequencies: getYearlyFrequencies,
			// eslint-disable-next-line
			wordFormFrequencies: getWordFormFrequencies,
			// eslint-disable-next-line
			regionalFrequencies: getRegionsFrequencies,
			// eslint-disable-next-line
			keywordInContext: getKeywordInContext,
			// eslint-disable-next-line
			mediaSources: getMediaSourceFrequencies,
		};

		const selectedSearches = ref([
			// "keywordInContext",
			// "regionalFrequencies",
			// "wordFormFrequencies",
			// "yearlyFrequencies",
			// "mediaSources"
		]);

		async function doSearches(query: CorpusQuery) {
			// console.log({ selsearchVal: selectedSearches.value });

			// eslint-disable-next-line
			return await Promise.all(selectedSearches.value.map((a) => searchFunctions[a](query)));
		}

		const queriesStore = useQuery();
		const { queries } = storeToRefs(queriesStore);

		// run undone queries on change of dimensions
		watch(selectedSearches, async (before, after) => {
			// console.log({ selectedSearches, before, after, isSame: before === after });
			// eslint-disable-next-line
			if (!after || before === after) return; //console.log("no change")
			// find querys with undone searches // or just do all and set queries do Only do if no data

			const functionsToRun = [];
			// eslint-disable-next-line
			if (!queriesStore.queries) return;
			queries.value.forEach((query: CorpusQuery) => {
				selectedSearches.value.forEach((searchKey: SearchFunctionKey) => {
					// console.log({ data: query.data, searchKey, exists: query.data[searchKey].length });
					if (query.data[searchKey].length) return;
					functionsToRun.push(searchFunctions[searchKey](query));
				});
			});
			await Promise.all(functionsToRun);
		});

		return { possibleSearchKeys, searchFunctions, selectedSearches, doSearches };
	},
	{ persist: true },
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useSearchSettingsStore, import.meta.hot));
}
