// this file incoperates the actual search for the yearly frequency data

export function useYearlyFrequenciesSearch() {
	const queryStore = useQuery();
	const { FREQUENCIES_MULTI_LEVEL_URL } = useAPIs();
	const { authenticatedFetch } = useAuthenticatedFetch();
	const getYearlyFrequencies = async (query: CorpusQuery) => {
		//const q = queryStore.queries.find(q => q.id === query.id);
		query.loading.yearlyFrequencies = true;
		const { data: _freqttYear } = await authenticatedFetch(FREQUENCIES_MULTI_LEVEL_URL, {
			params: {
				// @ts-ignore
				...queryStore.corporaForSearchKeys(query),
				format: "json",
				// fmaxitems: 5000,
				fpage: 1,
				freq_sort: "freq",
				group: 0,
				showpoc: 1,
				showreltt: 1,
				showrel: 1,
				freqlevel: 1,
				ml1attr: "doc.year",
				ml1ctx: "0~0 > 0",
				json: { concordance_query: query.concordance_query },
			},
		});
		// console.log({ freqttYear: freqttYear.value });
		const freqttYear = _freqttYear.value as YearlyFrequencyData;
		// console.log({ freqttYear });

		/* eslint-disable-next-line */
		const _yearlyData = freqttYear.Blocks ?? [];
		// console.log({ _yearlyData });

		const yearlyData = _yearlyData[0]?.Items ?? [];
		// console.log({ yearlyData });

		// console.log({ yearlyData, blocks: freqttYear.value.Blocks, items: freqttYear.value.Blocks[0].Items });
		// console.log('data', query.data);

		yearlyData.forEach(({ frq, reltt, Word }) => {
			const year = Word[0]?.n;
			query.data.yearlyFrequencies.push({
				year: Number(year),
				absolute: frq,
				relative: reltt,
			});
		});
		query.loading.yearlyFrequencies = false;
	};

	return { getYearlyFrequencies };
}
// q: aword, [lemma = "leben"]; corpname = amc_3.2; fttattr = doc.year; fcrit
// aword%2C%20%5Bword%3D%22arbeit%22%5D;amc_3.2;;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
// aword,+[word="aasdf"];corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
