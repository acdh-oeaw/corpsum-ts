// this file incoperates the actual search for the yearly frequency data

export function useMediaSourceSearch() {
	// const { FREQUENCIES_URL } = useAPIs();

	// const { authenticatedFetch } = useAuthenticatedFetch();
	// // todo storeToRefs as soon this data is actually fetched
	// const { corpusStatistics } = useCorporaStore();
	// const { getWordlist } = useWordlist();
	// todo implement proper mapping and returning of ifos
	/* eslint-disable */
	const getMediaSourceFrequencies = async (query: CorpusQuery) => {


		// query.loading.mediaSources = true;

		// const corpora = useCorporaStore();
		// const { data: _freqtt } = await authenticatedFetch(FREQUENCIES_URL, {
		// 	params: {
		// 		q: `${query.preparedQuery};${corpora.corporaForSearch};fttattr=doc.docsrc;fcrit=doc.id;flimit=0;format=json`,
		// 	},
		// });
		// const freqtt = _freqtt.value as SourcesResponseData

		// const wordlistDocsrcURI = `${engineAPI}wordlist?corpname=${selectedCorpus};wlmaxitems=1000;wlattr=doc.docsrc;wlminfreq=1;include_nonwords=1;wlsort=f;wlnums=docf;format=json`;

		// console.log('getMediaSourceFrequencies', { freqtt: freqtt.value, wordlist: wordlist.value });
		// console.log({ yearlyData, blocks: freqttYear.value.Blocks, items: freqttYear.value.Blocks[0].Items }););

		// const wordlist = await getWordlist();

		// console.log('in regional', { wordlist: wordlist.value });

		// const WordformData = freqtt.Lines[0];
		// WordformData.forEach(({ freq, Word }) => {
		// 	query.data.wordFormFrequencies.push({
		// 		word: Word[0].n,
		// 		absolute: freq,
		// 		relative: freq / corpusStatistics.totalAverageFrequency,
		// 	});
		// });

		query.loading.mediaSources = false;
	};

	return { getMediaSourceFrequencies };
}
// q: aword, [lemma = "leben"]; corpname = amc_3.2; fttattr = doc.year; fcrit
// aword%2C%20%5Bword%3D%22arbeit%22%5D;amc_3.2;;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
// aword,+[word="aasdf"];corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
