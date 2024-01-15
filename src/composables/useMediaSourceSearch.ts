export function useMediaSourceSearch() {
	const { FREQUENCIES_MULTI_LEVEL_URL } = useAPIs();

	const { authenticatedFetch } = useAuthenticatedFetch();
	const queryStore = useQuery();

	const getMediaSourceFrequencies = async (query: CorpusQuery) => {
		// doc.docsrc
		// query.loading.mediaSources = true;
		query.loading.mediaSources = true;

		const { data: mediaSources } = await authenticatedFetch(FREQUENCIES_MULTI_LEVEL_URL, {
			params: {
				// @ts-ignore
				...queryStore.corporaForSearchKeys(query),
				format: "json",
				fmaxitems: 5000,
				fpage: 1,
				freq_sort: "freq",
				group: 0,
				showpoc: 1,
				showreltt: 1,
				showrel: 1,
				freqlevel: 1,
				ml1attr: "doc.docsrc",
				ml1ctx: "0~0 > 0",
				json: { concordance_query: query.concordance_query },
			},
		});
		// // @ts-ignore
		// if (!mediaSources?.value || !mediaSources?.value.Blocks) {
		// 	query.loading.mediaSources = false;
		// 	return console.error("error on MediaSources");
		// }
		const mediaSourceData = mediaSources.value as FreqMLDocsRC;

		if (!mediaSourceData.Blocks) {
			query.loading.mediaSources = false;
			query.data.mediaSources = [];
			// alert('error on fetching freqml regions');
			return console.error("error on fetching freqml mediaSources");
		}
		const WordformData = (mediaSourceData.Blocks || [])[0]?.Items ?? [];
		WordformData.forEach(({ frq, Word, rel }) => {
			query.data.mediaSources.push({
				// @ts-ignore
				media: Word[0].n,
				// todo absolute is here actually also a frequency
				absolute: frq,
				relative: rel,
			});
		});

		query.loading.mediaSources = false;
	};

	return { getMediaSourceFrequencies };
}
// q: aword, [lemma = "leben"]; corpname = amc_3.2; fttattr = doc.year; fcrit
// aword%2C%20%5Bword%3D%22arbeit%22%5D;amc_3.2;;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
// aword,+[word="aasdf"];corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
