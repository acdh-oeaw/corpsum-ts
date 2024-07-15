import { acceptHMRUpdate, defineStore } from "pinia";
import { type Ref, ref } from "vue";

import { useCorporaStore } from "./corpora";

const keyToKey = {
	charrow: "char",
	cqlrow: "cql",
	iqueryrow: "iquery",
	lemmarow: "lemma",
	phraserow: "phrase",
	wordrow: "word",
};





const emptySelectedCorpusKWICViewInfo: KWICAttrsStructs = {
	attributes: [],
	structures: [],
}


export const useQuery = defineStore(
	"queryyyyyyy",
	() => {
		const nextQueryId = ref(0);
		const queries = ref([]) as Ref<Array<CorpusQuery>>;
		const corporaStore = useCorporaStore();

		function addQuery(userInput: string, type: CorpusQueryType) {
			let finalQuery = "";

			const concordance_query: Partial<ConcordanceQuery> = {};

			// @ts-ignore
			concordance_query[keyToKey[type]] = userInput;
			concordance_query.queryselector = type;

			// for old (regional Frequencies)
			switch (type) {
				case "wordrow":
					finalQuery = `[word="${userInput}"]`;
					break;
				case "lemmarow":
					finalQuery = `[lemma="${userInput}"]`;
					break;
				case "cqlrow":
					finalQuery = userInput;
					break;
				default: // default is word search
					finalQuery = `[word="${userInput}"]`;
			}

			const colorId = nextQueryId.value % colors.length; // so not to overshoot array
			const query: CorpusQuery = {
				id: nextQueryId.value++,
				color: colors[colorId]!,
				type,
				userInput,
				finalQuery,
				corpus: corporaStore.selectedCorpus?.corpname ?? "",
				subCorpus: corporaStore.selectedSubCorpus?.n ?? "",
				concordance_query: concordance_query as ConcordanceQuery,
				preparedQuery: `aword,${finalQuery}`, // note: this is done in the old project, so we do it here too
				showPicker: false,
				KWICAttrsStructs: { ...emptySelectedCorpusKWICViewInfo },
				KWICAttrsStructsOptions: {
					attributes: corporaStore.corpInfoResponse.attributes,
					structures: corporaStore.corpInfoResponse.structures,
				},
				data: {
					yearlyFrequencies: [],
					wordFormFrequencies: [],
					regionalFrequencies: [],
					keywordInContext: [],
					mediaSources: [],
				},
				loading: {
					yearlyFrequencies: false,
					wordFormFrequencies: false,
					regionalFrequencies: false,
					keywordInContext: false,
					mediaSources: false,
				},
			};
			queries.value.push(query);
			const foundQuery = queries.value.find((q) => q.id === query.id);
			if (!foundQuery) throw new Error("could not find query");
			return foundQuery;
		}

		const corporaForSearch = (query: CorpusQuery) =>
			`corpname=${query.corpus}${query.subCorpus ? `;usesubcorp=${query.subCorpus}` : ""}`;

		const corporaForSearchWithoutSubCorpus = (query: CorpusQuery) => `corpname=${query.corpus}`;

		const corporaForSearchKeys = (query: CorpusQuery) => {
			let val: Record<string, string | undefined> = {
				usecorp: query.corpus,
				corpname: query.corpus,
			};
			if (query.subCorpus)
				val = {
					...val,
					usesubcorp: query.subCorpus,
				};
			return val;
		};


		const getKWICqueryAttrStrcs = (query: CorpusQuery) => (
			{
				attrs: query.KWICAttrsStructs.attributes.map(attr => attr.name).join(','),
				structs: query.KWICAttrsStructs.structures.map(struct => struct.name).join(','),
			});

		return {
			nextQueryId,
			queries,
			addQuery,
			corporaForSearch,
			corporaForSearchWithoutSubCorpus,
			corporaForSearchKeys,
			getKWICqueryAttrStrcs,
		};
	},
	{ persist: { storage: persistedState.localStorage } },
	// { persist: true }
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useQuery, import.meta.hot));
}
