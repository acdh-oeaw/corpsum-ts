import { acceptHMRUpdate, defineStore, storeToRefs } from "pinia";
import { type Ref, ref, watch } from "vue";

export const useSearchSettingsStore = defineStore(
	"searchSettings",
	() => {
		const { getYearlyFrequencies } = useYearlyFrequenciesSearch();
		const { getWordFormFrequencies } = useWordFormsSearch();
		const { getMediaSourceFrequencies } = useMediaSourceSearch();
		const { getRegionsFrequencies } = useRegionsSearch();
		const { getKeywordInContext } = useKeywordInContextSearch();

		const possibleSearchKeys: Ref<Array<string>> = ref([
			"yearlyFrequencies",
			"wordFormFrequencies",
			"regionalFrequencies",
			"mediaSources",
			"keywordInContext",
		]);

		const searchFunctions: Record<SearchFunctionKey, (query: CorpusQuery) => Promise<void>> = {
			yearlyFrequencies: getYearlyFrequencies,

			wordFormFrequencies: getWordFormFrequencies,

			regionalFrequencies: getRegionsFrequencies,

			mediaSources: getMediaSourceFrequencies,

			keywordInContext: getKeywordInContext,
		};

		const selectedSearches: Ref<Array<SearchFunctionKey>> = ref([
			"yearlyFrequencies",
			"wordFormFrequencies",
			"regionalFrequencies",
			"mediaSources",
			"keywordInContext",
		]);

		async function doSearches(query: CorpusQuery) {
			return await Promise.all(
				selectedSearches.value.map(
					(a: SearchFunctionKey) =>
						(searchFunctions[a] as unknown as (query: CorpusQuery) => Promise<void>)(
							query,
						) as unknown as Promise<void>,
				),
			);
		}

		const queriesStore = useQuery();
		const { queries } = storeToRefs(queriesStore);

		// run undone queries on change of dimensions
		watch(selectedSearches, async (before, after) => {
			// console.log({ selectedSearches, before, after, isSame: before === after });
			// eslint-disable-next-line
			if (!after || before === after) return; //console.log("no change")
			// find querys with undone searches // or just do all and set queries do Only do if no data

			const functionsToRun: Array<Promise<void>> = [];
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

		return {
			possibleSearchKeys,
			searchFunctions,
			selectedSearches,
			doSearches,
		};
	},
	{
		persist: {
			paths: ["selectedSearches"],
		},
	},
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useSearchSettingsStore, import.meta.hot));
}
