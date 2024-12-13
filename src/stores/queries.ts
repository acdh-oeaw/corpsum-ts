import { acceptHMRUpdate, defineStore } from "pinia";
import { type Ref, ref } from "vue";

export const useQueriesStore = defineStore(
	"queries",
	() => {
		const selectedNoske: Ref<string> = ref('amc');
		const selectedCorpus: Ref<string | null> = ref(null);
		const selectedSubCorpus: Ref<string | null> = ref(null);

		return {
			selectedNoske,
			selectedCorpus,
			selectedSubCorpus,
		};
	},
	{ persist: { storage: persistedState.localStorage } },
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useQueriesStore, import.meta.hot));
}
