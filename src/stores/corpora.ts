import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, type Ref, ref, watch } from "vue";

import { useAuthenticatedFetch } from "../composables/useAuthenticatedFetch";

export type usedYear =
	| 2005
	| 2006
	| 2007
	| 2008
	| 2009
	| 2010
	| 2012
	| 2013
	| 2014
	| 2015
	| 2016
	| 2017
	| 2018
	| 2019
	| 2020
	| 2021
	| 2022;

export const useCorporaStore = defineStore(
	"corpora",
	() => {
		const { SUB_CORPUS_URL, CORPORA_LIST_URL } = useAPIs();
		const { authenticatedFetch } = useAuthenticatedFetch();

		const corpora = ref([]) as Ref<Array<Corpus>>;
		const corporaLoading = ref(false);
		const subCorporaLoading = ref(false);
		const tracker = ref(0);
		async function fetchCorpora() {
			corporaLoading.value = true;
			// console.log("in fetchCorpora", CORPORA_LIST_URL);
			const { data } = await authenticatedFetch(CORPORA_LIST_URL, {});
			// console.log("corpfetch ", { data: data.value, error: error.value });
			corporaLoading.value = false;

			if (!data.value) return false;
			const corporaInfo = data.value as CorporaInfo;
			corpora.value = [...corporaInfo.data];
			//			corporaInfo.data.forEach(c => corpora.value.push(c));
			// corpora.value.push(corporaInfo.data[0]);
			// corpora.value = [...corporaInfo.data];

			// console.log({ corpval: corpora.value });
			tracker.value++;
			return true;
		}

		const selectedCorpus: Ref<Corpus | null> = ref(null);
		const subCorpora: Ref<Array<SubCorpus>> = ref([]);
		const selectedSubCorpus: Ref<SubCorpus | null> = ref(null);

		async function fetchSubCorpora() {
			subCorporaLoading.value = true;
			// console.log({ before: before, after });
			// console.log("corporaStore.selectedCorpus changed");
			selectedSubCorpus.value = null;
			subCorpora.value = [];
			if (!selectedCorpus.value) return console.error("no corpus selected");
			const { data: _subCorpora, error } = await authenticatedFetch(SUB_CORPUS_URL, {
				params: {
					corpname: selectedCorpus.value.corpname,
					subcorpora: 1,
					format: "json",
				},
			});
			subCorporaLoading.value = false;

			if (error.value) return console.error("upsie whoopsie");
			else {
				if (!_subCorpora.value) return console.error("could not fetch subcorpora");
				const subCorporaResponseData = _subCorpora.value as unknown as CorpInfoResponse;

				subCorpora.value = subCorporaResponseData.subcorpora;
				// corporaStore.selectedSubCorpus = subCorpora.value[0];
			}
		}

		// auto-fetch subcorpora when selectedCorpus changes
		watch(selectedCorpus, async (before, after) => {
			if (!after || before?.name === after.name) return; //console.log("no change")
			// console.log({ selectedCorpus, before, after, isSame: before?.name === after.name });
			await fetchSubCorpora();
		});

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
			fetchCorpora,
			subCorpora,
			fetchSubCorpora,
			selectedCorpus,
			selectedSubCorpus,
			tracker,
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
