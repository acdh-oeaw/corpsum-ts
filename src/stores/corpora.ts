import { acceptHMRUpdate, defineStore } from "pinia";
import { type Ref, ref } from "vue";

export const useCorporaStore = defineStore(
	"corpora",
	() => {
		const selectedCorpus: Ref<string | null> = ref(null);
		const selectedSubCorpus: Ref<string | null> = ref(null);

		return {
			selectedCorpus,
			selectedSubCorpus,
		};
	},
	{ persist: { storage: persistedState.localStorage } },
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useCorporaStore, import.meta.hot));
}
