import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, type Ref, ref } from "vue";

import type { Type01CorpInfo, Type03CorporaList } from "~/lib/api-client";

/**
 * This Holds a
 */
export const useCorporaStore = defineStore(
	"corpora",
	() => {
		const corpora = ref([]) as Ref<Array<Type03CorporaList>>;
		const corporaLoading = ref(false);
		const subCorporaLoading = ref(false);

		const selectedCorpus: Ref<Type03CorporaList | null> = ref(null);
		const subCorpora: Ref<Array<unknown>> = ref([]);
		const corpInfoResponse: Ref<Type01CorpInfo | null> = ref(null);

		const selectedSubCorpus: Ref<SubCorpus | null> = ref(null);

		const corporaForSearch = computed(
			() =>
				`corpname=${selectedCorpus.value?.corpname}${
					selectedSubCorpus.value ? `;usesubcorp=${selectedSubCorpus.value.n}` : ""
				}`,
		);

		const corporaForSearchWithoutSubCorpus = computed(
			() => `corpname=${selectedCorpus.value?.corpname}`,
		);

		const corporaForSearchKeys = computed(() => {
			let val: Record<string, string | undefined> = {
				usecorp: selectedCorpus.value?.corpname,
				corpname: selectedCorpus.value?.corpname,
			};
			if (selectedSubCorpus.value)
				val = {
					...val,
					usesubcorp: selectedSubCorpus.value.n,
				};
			return val;
		});

		return {
			corpora,
			subCorpora,
			corpInfoResponse,
			selectedCorpus,
			selectedSubCorpus,
			corporaForSearch,
			corporaForSearchKeys,
			corporaLoading,
			corporaForSearchWithoutSubCorpus,
			subCorporaLoading,
		};
	},
	{ persist: { storage: persistedState.localStorage } },
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useCorporaStore, import.meta.hot));
}
