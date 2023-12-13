// this file incoperates the actual search for the yearly frequency data
import { useCorporaStore } from "../stores/corpora";

export function useWordFormsSearch() {
	const { FREQUENCIES_MULTI_LEVEL_URL } = useAPIs();
	// const queryStore = useQuery();

	const { authenticatedFetch } = useAuthenticatedFetch();

	const getWordFormFrequencies = async (query: CorpusQuery) => {
		query.loading.wordFormFrequencies = true;

		const corpora = useCorporaStore();
		/* eslint-disable */
		const { data: freqtWords } = await authenticatedFetch(FREQUENCIES_MULTI_LEVEL_URL, {
			params: {
				// @ts-ignore
				...corpora.corporaForSearchKeys.value,

				default_attr: "lemma",
				attrs: "word",
				refs: "=doc.id",
				attr_allpos: "all",
				viewmode: "kwic",
				cup_hl: "q",
				structs: "s, g",
				fromp: 1,
				pagesize: 20,
				kwicleftctx: "100#",
				kwicrightctx: "100#",
				json: { concordance_query: [{ queryselector: "iqueryrow", iquery: query.userInput }] },
			},
		});
		console.log({ freqtWords: freqtWords.value });
		// // console.log({ yearlyData, blocks: freqttYear.value.Blocks, items: freqttYear.value.Blocks[0].Items }););
		const freqtWordsData = freqtWords.value as FreqsResponseData;
		const WordformData = freqtWordsData.Blocks[0]?.Items ?? [];

		WordformData.forEach(({ frq, fpm, Word }) => {
			query.data.wordFormFrequencies.push({
				word: Word[0]?.n ?? "0",
				absolute: frq,
				// todo use actual relative Value as provided by Api.
				relative: fpm,
				// relative: frq / corpusStatistics.totalAverageFrequency,
			});
		});

		query.loading.wordFormFrequencies = false;
	};

	return { getWordFormFrequencies };
}
// q: aword, [lemma = "leben"]; corpname = amc_3.2; fttattr = doc.year; fcrit
// aword%2C%20%5Bword%3D%22arbeit%22%5D;amc_3.2;;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
// aword,+[word="aasdf"];corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
