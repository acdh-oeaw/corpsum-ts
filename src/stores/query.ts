import { defineStore } from "pinia";

const getEmptyRegionalFrequencyData = () => ({
	aost: { absolute: null, relative: null },
	awest: { absolute: null, relative: null },
	amitte: { absolute: null, relative: null },
	asuedost: { absolute: null, relative: null },
});

export const useQuery = defineStore("query", {
	persist: true,
	state: () => ({
		nextQueryId: 0,
		queries: [] as Array<CorpusQuery>,
	}),

	getters: {},

	actions: {
		addQuery(userInput: string, type: CorpusQueryType) {
			let finalQuery = "";
			switch (type) {
				case "word":
					finalQuery = `[word="${userInput}"]`;
					break;
				case "lemma":
					finalQuery = `[lemma="${userInput}"]`;
					break;
				case "lc":
					finalQuery = `[lc="${userInput.toLowerCase()}"]`;
					break;
				case "lc*":
					finalQuery = `[lc=".*${userInput.toLowerCase()}.*"]`;
					break;
				case "custom":
					finalQuery = userInput;
					break;
				default: // default is word search
					finalQuery = `[word="${userInput}"]`;
			}
			const colorId = (this.nextQueryId % colors.length) as number; // so not to overshoot array
			const query: CorpusQuery = {
				id: this.nextQueryId++,
				color: colors[colorId] as string,
				type,
				userInput,
				finalQuery,
				preparedQuery: `aword,${finalQuery}`, // note: this is done in the old project, so we do it here too
				showPicker: false,
				data: {
					yearlyFrequencies: [],
					wordFormFrequencies: [],
					regionalFrequencies: getEmptyRegionalFrequencyData(),
					keywordInContext: [],
				},
				loading: {
					yearlyFrequencies: false,
					formFrequencies: false,
					regionalFrequencies: false,
					keywordInContext: false,
					mediaSources: false,
				},
			};
			this.queries.push(query);
			const foundQuery = this.queries.find((q) => q.id === query.id);
			if (!foundQuery) throw new Error("could not find query")
			return foundQuery;
		},
	},
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useQuery, import.meta.hot));
}
