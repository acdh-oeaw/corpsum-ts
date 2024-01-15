import { useQuery } from "../stores/query";

export function useKeywordInContextSearch() {
	const { VIEWSATTRSX_URL } = useAPIs();
	const queryStore = useQuery();

	// const queryStore = useQuery();

	const { authenticatedFetch } = useAuthenticatedFetch();

	const getKeywordInContext = async (query: CorpusQuery) => {
		query.loading.keywordInContext = true;

		const { data } = await authenticatedFetch(VIEWSATTRSX_URL, {
			params: {
				q: `${query.preparedQuery};${queryStore.corporaForSearch(
					query,
				)};viewmode=kwic;attrs=word;ctxattrs=word;setattrs=word;allpos=kw;refs==doc.id,=doc.datum,=doc.region,=doc.ressort2,=doc.docsrc_name;pagesize=1000;newctxsize=30;async=0;format=json`,
			},
		});
		const keywordInContext = data.value as KeywordInContextData;
		// console.log('keywordInContext', { keywordInContext: keywordInContext.value });
		// eslint-disable require-atomic-updates
		/* eslint-disable-next-line */
		query.data.keywordInContext = (keywordInContext.Lines || []).map(
			({ Tbl_refs, Left, Kwic, toknum, Right }) => ({
				// this mapping is directly taken from the ancient code
				refs: Tbl_refs,
				date: Tbl_refs[1] ?? "",
				source: Tbl_refs[4] ?? "",
				region: Tbl_refs[2] ?? "",
				left: Left.map(({ str }: { str: string }) => str).join(" "),
				word: typeof Kwic[0] !== "undefined" ? Kwic[0].str : "",
				right: Right.map(({ str }: { str: string }) => str).join(" "),
				docid: Tbl_refs[0] ?? "",
				topic: Tbl_refs[3] ?? "",
				toknum,
			}),
		);
		// eslint-enable
		query.loading.keywordInContext = false;
	};

	return { getKeywordInContext };
}
// q: aword, [lemma = "leben"]; corpname = amc_3.2; fttattr = doc.year; fcrit
// aword%2C%20%5Bword%3D%22arbeit%22%5D;amc_3.2;;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
// aword,+[word="aasdf"];corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
