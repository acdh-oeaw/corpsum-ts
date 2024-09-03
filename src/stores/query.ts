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
};

export const useQueryStore = defineStore(
	"newQueryStore",
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
			if (!corporaStore.corpInfoResponse) throw new Error("corpInfoResponse not loaded");
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
					attributes: (corporaStore.corpInfoResponse.attributes ?? [] as unknown) as Array<KWICAttribute>,
					structures: (corporaStore.corpInfoResponse.structures ?? [] as unknown) as Array<KWICStructure>,
				},
				facettingValues: {},
				loading: {
					yearlyFrequencies: false,
					wordFormFrequencies: false,
					regionalFrequencies: false,
					keywordInContext: false,
					mediaSources: false,
					collocations: false,
				},
			};
			queries.value.push(query);
			const foundQuery = queries.value.find((q) => q.id === query.id);
			if (!foundQuery) throw new Error("could not find query");
			return foundQuery;
		}

		const getKWICqueryAttrStrcs = (query: CorpusQuery) => ({
			attrs: query.KWICAttrsStructs.attributes.map((attr) => attr.name).join(","),
			structs: query.KWICAttrsStructs.structures.map((struct) => struct.name).join(","),
		});

		const getQueryWithFacetting = (query: CorpusQuery) => {
			const result: Record<string, string> = { ...query.concordance_query };
			for (const key in query.facettingValues) {
				const elem = query.facettingValues[key];
				if (!elem) continue;
				// console.log({ key, elem })
				if (Array.isArray(elem)) {
					if (!elem.length) continue;
					// @ts-ignore
					result[`sca_${key}`] = elem;
				} else result[elem.key] = elem.value;
			}
			return result;
		};
		return {
			nextQueryId,
			queries,
			addQuery,
			getKWICqueryAttrStrcs,
			getQueryWithFacetting,
		};
	},
	{ persist: { storage: persistedState.localStorage } },
	// { persist: true }
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useQueryStore, import.meta.hot));
}
