import { acceptHMRUpdate, defineStore } from "pinia";
import { type Ref, ref } from "vue";

const fixedKWICStructures = ["doc.id", "doc.datum", "doc.region", "doc.docsrc"];

export const useQueryStore = defineStore(
	"QueryStoreWithNewStructure",
	() => {
		const nextQueryId = ref(0);
		const queries = ref([]) as Ref<Array<CorpusQuery>>;

		const getKWICqueryAttrStrcs = (query: CorpusQuery) => ({
			attrs: query.KWICAttrsStructs.attributes.join(","),
			structs: query.KWICAttrsStructs.structures.join(","),
		});

		const getQueryWithFacetting = (query: CorpusQuery) => {
			const result: Record<string, string | Array<string>> = { ...query.concordance_query };
			for (const key in query.facettingValues) {
				const elem = query.facettingValues[key];
				if (!elem) continue;
				if (Array.isArray(elem)) {
					if (!elem.length) continue;
					result[`sca_${key}`] = elem;
				} else result[elem.key] = elem.value;
			}
			return result;
		};
		return {
			nextQueryId,
			fixedKWICStructures,
			queries,
			getKWICqueryAttrStrcs,
			getQueryWithFacetting,
		};
	},
	{ persist: true },
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useQueryStore, import.meta.hot));
}
