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
			"keywordInContext",
		]);

		const selectedSearches: Ref<Array<SearchFunctionKey>> = ref([
			"yearlyFrequencies",
			"wordFormFrequencies",
			"regionalFrequencies",
			"mediaSources",
			"keywordInContext",
		]);

		return {
			possibleSearchKeys,
			selectedSearches,
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
