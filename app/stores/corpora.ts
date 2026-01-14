import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, type Ref, ref } from "vue";

import type { components } from "~/lib/noske-types";

type CorpInfoResponse = components["schemas"]["01_corp_info"];
type CorporaListItem = components["schemas"]["03_corpora_list"];

export const useCorporaStore = defineStore(
	"corpora",
	() => {
		const corpora = ref([]) as Ref<Array<CorporaListItem>>;
		const corporaLoading = ref(false);
		const subCorporaLoading = ref(false);

		const selectedCorpus: Ref<CorporaListItem | null> = ref(null);
		const subCorpora: Ref<Array<unknown>> = ref([]);
		const corpInfoResponse: Ref<CorpInfoResponse | null> = ref(null);

		const selectedSubCorpus: Ref<SubCorpus | null> = ref(null);

		const corporaForSearch = computed(
			() =>
				`corpname=${selectedCorpus.value?.corpname ?? ""}${selectedSubCorpus.value ? `;usesubcorp=${selectedSubCorpus.value.n}` : ""}`,
		);

		const corporaForSearchWithoutSubCorpus = computed(
			() => `corpname=${selectedCorpus.value?.corpname ?? ""}`,
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
	{ persist: true },
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useCorporaStore, import.meta.hot));
}
