// this file incoperates the actual search for the yearly frequency data
import { useCorporaStore } from "../stores/corpora";

export function useYearlyFrequenciesSearch() {
	const { FREQUENCIES_TIME_URL } = useAPIs();
	const { authenticatedFetch } = useAuthenticatedFetch();
	const getYearlyFrequencies = async (query: CorpusQuery) => {
		//const q = queryStore.queries.find(q => q.id === query.id);
		query.loading.yearlyFrequencies = true;
		const corpora = useCorporaStore();
		// console.log("corpora.corporaForSearch", corpora.corporaForSearch, corpora.selectedCorpus);

		const { data: _freqttYear } = await authenticatedFetch(FREQUENCIES_TIME_URL, {
			params: {
				// Why The Fuck is all of this in the query?
				// aword,[word="asdf"];corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
				q: `${query.preparedQuery};${corpora.corporaForSearch};fttattr=doc.year;fcrit=doc.id;flimit=0;format=json`,
			},
		});
		// console.log({ freqttYear: freqttYear.value });
		const freqttYear = _freqttYear.value as YearlyFrequencyData;
		const _yearlyData = freqttYear.Blocks ?? [];
		const yearlyData = _yearlyData[0]?.Items ?? [];
		// console.log({ yearlyData, blocks: freqttYear.value.Blocks, items: freqttYear.value.Blocks[0].Items });
		// console.log('data', query.data);

		yearlyData.forEach(({ frq, fpm, Word }) => {
			const year = Word[0]?.n;
			query.data.yearlyFrequencies.push({
				year: Number(year),
				absolute: frq,
				relative: fpm,
			});
		});
		query.loading.yearlyFrequencies = false;
	};

	return { getYearlyFrequencies };
}
// q: aword, [lemma = "leben"]; corpname = amc_3.2; fttattr = doc.year; fcrit
// aword%2C%20%5Bword%3D%22arbeit%22%5D;amc_3.2;;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
// aword,+[word="aasdf"];corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
