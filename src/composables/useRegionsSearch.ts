// this file incoperates the actual search for the yearly frequency data
import { storeToRefs } from "pinia";

import { useCorporaStore } from "../stores/corpora";

export function useRegionsSearch() {
	const { FREQUENCIES_MULTI_LEVEL_URL } = useAPIs();
	const corporaStore = useCorporaStore();
	const { corporaForSearch, selectedCorpus } = storeToRefs(corporaStore);
	// const queryStore = useQuery();

	const { authenticatedFetch } = useAuthenticatedFetch();

	const escapeZeroSafe = (input: unknown) => (typeof input === "number" ? input : null);

	const getRegionsFrequencies = async (query: CorpusQuery) => {
		query.loading.regionalFrequencies = true;

		// from ancient code
		//const queryTermEncoded = encodeURIComponent(`aword,${queryTerm} within <doc ${metaAttr}="${metaVal}"/>`);
		//const viewattrsxURI = `${engineAPI}viewattrsx?q=${queryTermEncoded};corpname=${selectedCorpus};${useSubCorp};attrs=word;ctxattrs=word;setattrs=word;allpos=kw;setrefs==doc.id;setrefs==doc.region;pagesize=10;newctxsize=5;async=0;format=json`;

		const regions: Array<Region> = ["aost", "awest", "amitte", "asuedost"];

		const { data } = await authenticatedFetch(FREQUENCIES_MULTI_LEVEL_URL, {
			params: {
				corpname: selectedCorpus.value?.corpname, //amc_4.2,
				format: "json",
				fmaxitems: 5000,
				fpage: 1,
				freq_sort: "freq",
				group: 0,
				showpoc: 1,
				showreltt: 1,
				showrel: 1,
				freqlevel: 1,
				ml1attr: "doc.region",
				ml1ctx: "0~0 > 0",
				// todo Query needs to able to accept also Lemma queries and so on
				json: { concordance_query: [{ queryselector: "iqueryrow", iquery: query.userInput }] },
				//https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/viewattrsx?q=aword%2C%5Bword%3D%22leben%22%5D%20within%20%3Cdoc%20region%3D%22aost%22%2F%3E;corpname=amc3_demo;viewmode=kwic;attrs=word;ctxattrs=word;setattrs=word;allpos=kw;setrefs==doc.id;setrefs==doc.region;pagesize=10;newctxsize=5;async=0;format=json
				//				q: `aword,${query.finalQuery} within <doc region="${region}"/>;${corporaForSearch.value};attrs=word;viewmode=kwic;ctxattrs=word;setattrs=word;allpos=kw;setrefs==doc.id;setrefs==doc.region;pagesize=10;newctxsize=5;async=0;format=json`,
			},
		});
		if (!data.value) {
			query.loading.regionalFrequencies = false;
			return console.error("error on fetching freqml regions");
		}
		const freqmlRegionData = data.value as unknown as FreqMLRegionResponse;
		query.data.regionalFrequencies = freqmlRegionData.Blocks[0].Items.map(
			(regionalData: FreqMLRegion) => ({
				region: regionalData.Word[0].n,
				absolute: escapeZeroSafe(regionalData.frq),
				relative: escapeZeroSafe(regionalData.fpm),
			}),
		);

		query.loading.regionalFrequencies = false;
	};

	return { getRegionsFrequencies };
}
// q: aword, [lemma = "leben"]; corpname = amc_3.2; fttattr = doc.year; fcrit
// aword%2C%20%5Bword%3D%22arbeit%22%5D;amc_3.2;;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
// aword,+[word="aasdf"];corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
