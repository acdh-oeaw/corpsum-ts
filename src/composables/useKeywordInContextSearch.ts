// this file incoperates the actual search for the yearly frequency data
import { storeToRefs } from "pinia";

import { useCorporaStore } from "../stores/corpora";

export function useKeywordInContextSearch() {
	const { VIEWSATTRSX_URL } = useAPIs();
	const corporaStore = useCorporaStore();
	const { corporaForSearch } = storeToRefs(corporaStore);
	// const queryStore = useQuery();

	const { authenticatedFetch } = useAuthenticatedFetch();

	const getKeywordInContext = async (query: CorpusQuery) => {
		query.loading.keywordInContext = true;

		const { data } = await authenticatedFetch(VIEWSATTRSX_URL, {
			params: {
				// https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/viewattrsx?q=aword%2C%5Blc%3D%22.*arbeit.*%22%5D%20within%20%3Cdoc%20region%3D%22asuedost%22%2F%3E;corpname=amc_3.2;usesubcorp=zdl2021_04;viewmode=kwic;attrs=word;ctxattrs=word;setattrs=word;allpos=kw;setrefs==doc.id;setrefs==doc.region;pagesize=10;newctxsize=5;async=0;format=json
				//const viewattrs`${engineAPI}viewattrsx?q=${queryTermEncoded};corpname=${selectedCorpus};${subCorp}viewmode=kwic;attrs=word;ctxattrs=word;setattrs=word;allpos=kw;setrefs==doc.id;setrefs==doc.datum;setrefs==doc.region;setrefs==doc.ressort2;setrefs==doc.docsrc_name;pagesize=1000;newctxsize=30;async=0;format=json`;
				// ;corpname=${selectedCorpus};${subCorp}viewmode=kwic;attrs=word;ctxattrs=word;setattrs=word;allpos=kw;setrefs==doc.id;setrefs==doc.datum;setrefs==doc.region;setrefs==doc.ressort2;setrefs==doc.docsrc_name;pagesize=1000;newctxsize=30;async=0;format=json`;
				q: `${query.preparedQuery};${corporaForSearch.value};viewmode=kwic;attrs=word;ctxattrs=word;setattrs=word;allpos=kw;setrefs==doc.id;setrefs==doc.datum;setrefs==doc.region;setrefs==doc.ressort2;setrefs==doc.docsrc_name;pagesize=1000;newctxsize=30;async=0;format=json`,
			},
		});
		const keywordInContext = data.value as KeywordInContextData;
		// console.log('keywordInContext', { keywordInContext: keywordInContext.value });
		// eslint-disable-next-line require-atomic-updates
		query.data.keywordInContext = keywordInContext.Lines.map(
			({ Tbl_refs, Left, Kwic, toknum, Right }) => ({
				// this mapping is directly taken from the ancient code
				refs: Tbl_refs.join(),
				// date: Tbl_refs[1] ?? "",
				// source: Tbl_refs[4] ?? "",
				// region: Tbl_refs[2] ?? "",
				left: Left.map(({ str }: { str: string }) => str).join(' '),
				word: typeof Kwic[0] !== "undefined" ? Kwic[0].str : "",
				right: Right.map(({ str }: { str: string }) => str).join(' '),
				docid: Tbl_refs[0] ?? "",
				topic: Tbl_refs[3] ?? "",
				toknum,
			}),
		);

		query.loading.keywordInContext = false; // eslint-disable-line require-atomic-updates
	};

	return { getKeywordInContext };
}
// q: aword, [lemma = "leben"]; corpname = amc_3.2; fttattr = doc.year; fcrit
// aword%2C%20%5Bword%3D%22arbeit%22%5D;amc_3.2;;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
// aword,+[word="aasdf"];corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
