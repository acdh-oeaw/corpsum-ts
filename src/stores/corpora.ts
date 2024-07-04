import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, type Ref, ref, watch } from "vue";

import { useAuthenticatedFetch } from "@/composables/useAuthenticatedFetch";

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


interface KWICAttribute {
	name: string;
	id_range?: number;
	label: string;
	dynamic: string;
	fromattr: string;
	size?: string;
}

interface KWICStructure {
	name: string;
	label: string;
	attributes: KWICAttribute[];
	size: string;
}
interface SelectedCorpusKWICViewInfo {
	attributes: Array<KWICAttribute>;
	structures: Array<KWICStructure>;
}

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
			const { data } = await authenticatedFetch(CORPORA_LIST_URL, {});
			corporaLoading.value = false;

			if (!data.value) return false;
			const corporaInfo = data.value as CorporaInfo;
			corpora.value = [...corporaInfo.data];
			tracker.value++;
			return true;
		}



		const selectedCorpus: Ref<Corpus | null> = ref(null);
		const subCorpora: Ref<Array<SubCorpus>> = ref([]);
		const corpInfoResponse: Ref<any> = ref(null);
		const selectedSubCorpus: Ref<SubCorpus | null> = ref(null);
		const emptySelectedCorpusKWICViewInfo: SelectedCorpusKWICViewInfo = {
			attributes: [],
			structures: [],
		}
		const selectedCorpusKWICViewInfo: Ref<SelectedCorpusKWICViewInfo> = ref(emptySelectedCorpusKWICViewInfo);

		const existingCorpusKWICSecetion = computed(() => {
			if (!corpInfoResponse.value || !selectedCorpusKWICViewInfo.value) return emptySelectedCorpusKWICViewInfo;
			return {
				attributes: selectedCorpusKWICViewInfo.value.attributes.filter(a => corpInfoResponse.value.attributes.find(ca => ca.name === a.name)),
				structures: selectedCorpusKWICViewInfo.value.structures.filter(a => corpInfoResponse.value.structures.find(ca => ca.name === a.name)),
			}
		})

		async function fetchSubCorpora() {
			subCorporaLoading.value = true;
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

			corpInfoResponse.value = _subCorpora.value;

			if (!_subCorpora.value) return console.error("could not fetch subcorpora");
			const subCorporaResponseData = _subCorpora.value as unknown as CorpInfoResponse;
			subCorpora.value = subCorporaResponseData.subcorpora;

		}

		watch(selectedCorpus, async (after, before) => {
			if (!after || before?.name === after.name) return;
			await fetchSubCorpora();
		});

		const corporaForSearch = computed(
			() =>
				`corpname=${selectedCorpus.value?.corpname}${selectedSubCorpus.value ? `;usesubcorp=${selectedSubCorpus.value.n}` : ""
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
			corpInfoResponse,
			fetchSubCorpora,
			selectedCorpus,
			selectedSubCorpus,
			selectedCorpusKWICViewInfo,
			tracker,
			corporaForSearch,
			corporaForSearchKeys,
			corporaLoading,
			corporaForSearchWithoutSubCorpus,
			subCorporaLoading,
			existingCorpusKWICSecetion,
		};
	},
	{ persist: { storage: persistedState.localStorage } },
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useCorporaStore, import.meta.hot));
}
