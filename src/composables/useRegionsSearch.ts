// this file incoperates the actual search for the yearly frequency data
import { storeToRefs } from "pinia";

import { useCorporaStore } from "../stores/corpora";

export function useRegionsSearch() {
	const { VIEWSATTRSX_URL } = useAPIs();
	const corporaStore = useCorporaStore();
	const { corporaForSearch } = storeToRefs(corporaStore);
	// const queryStore = useQuery();

	const { authenticatedFetch } = useAuthenticatedFetch();

	const getRegionalRequestPerRegion = async (query: CorpusQuery, region: string) =>
		authenticatedFetch(VIEWSATTRSX_URL, {
			params: {
				//https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/viewattrsx?q=aword%2C%5Bword%3D%22leben%22%5D%20within%20%3Cdoc%20region%3D%22aost%22%2F%3E;corpname=amc3_demo;viewmode=kwic;attrs=word;ctxattrs=word;setattrs=word;allpos=kw;setrefs==doc.id;setrefs==doc.region;pagesize=10;newctxsize=5;async=0;format=json
				q: `aword,${query.finalQuery} within <doc region="${region}"/>;${corporaForSearch.value};attrs=word;viewmode=kwic;ctxattrs=word;setattrs=word;allpos=kw;setrefs==doc.id;setrefs==doc.region;pagesize=10;newctxsize=5;async=0;format=json`,
			},
			// params: {
			// 	q: encodeURIComponent(`aword,${query.finalQuery} within <doc region="${region}"/>`),
			// 	corpname: selectedCorpus.value.id,
			// 	viewmode: "kwic",
			// 	attrs: "word",
			// 	ctxattrs: "word",
			// 	setattrs: "word",
			// 	allpos: "kw",
			// 	//setrefs: "=doc.id",
			// 	setrefs: "=doc.region",
			// 	pagesize: "10",
			// 	newctxsize: "5",
			// 	async: "0",
			// 	format: "json",
			// },
		});

	const escapeZeroSafe = (input: any) => (typeof input === "number" ? input : input || null);

	const getRegionsFrequencies = async (query: CorpusQuery) => {
		query.loading.regionalFrequencies = true;

		// from ancient code
		//const queryTermEncoded = encodeURIComponent(`aword,${queryTerm} within <doc ${metaAttr}="${metaVal}"/>`);
		//const viewattrsxURI = `${engineAPI}viewattrsx?q=${queryTermEncoded};corpname=${selectedCorpus};${useSubCorp};attrs=word;ctxattrs=word;setattrs=word;allpos=kw;setrefs==doc.id;setrefs==doc.region;pagesize=10;newctxsize=5;async=0;format=json`;

		const regions: Array<Region> = ["aost", "awest", "amitte", "asuedost"];

		const regionalResponses = await Promise.all(
			regions.map((region) => getRegionalRequestPerRegion(query, region)),
		);

		regionalResponses.forEach((response, i) => {
			const { data: _regionalData } = response;
			const regionalData = _regionalData.value  as RegionalResponseData;
			// console.log('one step ahead', { regionalData, a: regionalData.value.fullsize });
			const region = regions[i];
			// console.log('region', { region, regionalData });
			query.data.regionalFrequencies[region || "awest"] = {
				absolute: escapeZeroSafe(regionalData.fullsize),
				relative: escapeZeroSafe(regionalData.relsize),
			};
		});

		query.loading.regionalFrequencies = false;
	};

	return { getRegionsFrequencies };
}
// q: aword, [lemma = "leben"]; corpname = amc_3.2; fttattr = doc.year; fcrit
// aword%2C%20%5Bword%3D%22arbeit%22%5D;amc_3.2;;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
// aword,+[word="aasdf"];corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
