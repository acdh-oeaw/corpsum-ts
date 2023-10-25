import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, type Ref, ref, watch } from "vue";

import { useAuthenticatedFetch } from "../composables/useAuthenticatedFetch";

export const useCorporaStore = defineStore(
	"corpora",
	() => {
		const corpora: Ref<Array<Corpus>> = ref([
			{
				name: "Corpus: AMC 3.2",
				id: "amc_3.2",
				description: "The latest and full Austrian Media Corpus",
			},
			{
				name: "Corpus: AMC 60M",
				id: "amc_60M",
				description: "A 60M token sample of Austrian Media Corpus",
			},
			{
				name: "Corpus: AMC Demo",
				id: "amc3_demo",
				description: "A limited-size demo of Austrian Media Corpus",
			},
			{
				name: "Corpus: wrdiarium02.1",
				id: "wrdiarium02.1",
				description: "Wienerisches Diarium 02.1",
			},
		]);

		const selectedCorpus: Ref<Corpus | null> = ref(null);
		const subCorpora: Ref<Array<SubCorpus>> = ref([]);
		const selectedSubCorpus: Ref<SubCorpus | null> = ref(null);

		const corpusStatistics = ref({
			// todo fetch this data from server
			totalAverageFrequency: 30,
			// todo Fetch this data from the server
			avgYearlyFrequencies: {
				2005: 5,
				2006: 5,
				2007: 5,
				2008: 5,
				2009: 5,
				2010: 5,
				2012: 5,
				2013: 5,
				2014: 5,
				2015: 5,
				2016: 5,
				2017: 5,
				2018: 5,
				2019: 5,
				2020: 5,
				2021: 5,
				2022: 5,
			},
		});

		const { SUB_CORPUS_URL } = useAPIs();
		const { authenticatedFetch } = useAuthenticatedFetch();
		// auto-fetch subcorpora when selectedCorpus changes
		watch(selectedCorpus, async (before, after) => {
			if (!after || before === after) return; //console.log("no change")
			// console.log({ before: before, after });
			// console.log("corporaStore.selectedCorpus changed");
			selectedSubCorpus.value = null;
			subCorpora.value = [];
			if (!selectedCorpus.value) return console.error("no corpus selected");
			const { data: _subCorpora, error } = await authenticatedFetch(SUB_CORPUS_URL, {
				params: {
					corpname: selectedCorpus.value.id,
					subcorpora: 1,
					format: "json",
				},
			});
			if (error.value) return console.error("upsie whoopsie");
			else {
				if (!_subCorpora.value) return console.error("could not feth subcorpora");
				const subCorporaResponseData = _subCorpora.value as unknown as CorpInfoResponse;

				subCorpora.value = subCorporaResponseData.subcorpora;
				// corporaStore.selectedSubCorpus = subCorpora.value[0];
			}
		});

		const corporaForSearch = computed(
			() =>
				`corpname=${selectedCorpus.value?.id}${selectedSubCorpus.value ? `;usesubcorp=${selectedSubCorpus.value.n}` : ""
				}`,
		);

		return {
			corpora,
			subCorpora,
			selectedCorpus,
			selectedSubCorpus,
			corporaForSearch,
			corpusStatistics,
		};
	},
	{ persist: true },
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useCorporaStore, import.meta.hot));
}
