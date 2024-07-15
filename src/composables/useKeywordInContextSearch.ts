import { useQuery } from "../stores/query";

export function useKeywordInContextSearch() {
	const { CINCORDANCE_URL } = useAPIs();
	const queryStore = useQuery();

	// const queryStore = useQuery();

	const { authenticatedFetch } = useAuthenticatedFetch();

	const getKeywordInContext = async (query: CorpusQuery) => {
		query.loading.keywordInContext = true;
		const options = {
			method: "POST",
			query: {

				...queryStore.corporaForSearchKeys(query),
				...queryStore.getKWICqueryAttrStrcs(query),

				refs: '=doc.id,=doc.datum,=doc.region,=doc.ressort2,=doc.docsrc_name',
				attr_allpos: 'all',
				viewmode: 'kwic',
				// cup_hl: q,

				// fromp: 1,
				pagesize: 1000,
				kwicleftctx: '100#',
				kwicrightctx: '100#',
				json: { concordance_query: query.concordance_query },
			}
		};
		console.log({ options, }, JSON.stringify(options, null, 2))
		const { data } = await authenticatedFetch(CINCORDANCE_URL, options);
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
