import { acceptHMRUpdate, defineStore } from "pinia";
import { type Ref, ref } from "vue";

export const useSearchSettingsStore = defineStore(
	"searchSettings",
	() => {
		const possibleSearchKeys: Ref<Array<string>> = ref([
			"yearlyFrequencies",
			"wordFormFrequencies",
			"regionalFrequencies",
			"mediaSources",
			"collocations",
			"keywordInContext",
		]);

		const selectedSearches: Ref<Array<SearchFunctionKey>> = ref([
			"yearlyFrequencies",
			"wordFormFrequencies",
			"regionalFrequencies",
			"mediaSources",
			"collocations",
			"keywordInContext",
		]);

		return {
			possibleSearchKeys,
			selectedSearches,
		};
	},
	{
		persist: {
			pick: ["selectedSearches"],
		},
	},
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useSearchSettingsStore, import.meta.hot));
}
