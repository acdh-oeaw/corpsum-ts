// this file incoperates the actual search for the yearly frequency data
import { useCorporaStore } from "../stores/corpora";

export function useWordFormsSearch() {
	const { WORD_FORMS_URL } = useAPIs();
	const { corpusStatistics } = useCorporaStore();
	// const queryStore = useQuery();

	const { authenticatedFetch } = useAuthenticatedFetch();

	const getWordFormFrequencies = async (query: CorpusQuery) => {
		query.loading.formFrequencies = true;

		const corpora = useCorporaStore();
		const { data: freqtWords } = await authenticatedFetch(WORD_FORMS_URL, {
			params: {
				q: `${query.preparedQuery};${corpora.corporaForSearch};fcrit=word/e 0~0>0;flimit=0;format=json`,
			},
		});
		// console.log({ freqtWords: freqtWords.value });
		// // console.log({ yearlyData, blocks: freqttYear.value.Blocks, items: freqttYear.value.Blocks[0].Items }););
		const freqtWordsData = freqtWords.value as FreqsResponseData;
		const WordformData = freqtWordsData.Blocks[0]?.Items ?? [];

		WordformData.forEach(({ freq, Word }) => {
			query.data.wordFormFrequencies.push({
				word: Word[0]?.n ?? "0",
				absolute: freq,
				relative: freq / corpusStatistics.totalAverageFrequency,
			});
		});
		query.loading.formFrequencies = false;
	};

	return { getWordFormFrequencies };
}
// q: aword, [lemma = "leben"]; corpname = amc_3.2; fttattr = doc.year; fcrit
// aword%2C%20%5Bword%3D%22arbeit%22%5D;amc_3.2;;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
// aword,+[word="aasdf"];corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
