// this file incoperates the actual search for the yearly frequency data

import { storeToRefs } from "pinia";

export function useMediaSourceSearch() {
	const { FREQUENCIES_MULTI_LEVEL_URL } = useAPIs();

	const { authenticatedFetch } = useAuthenticatedFetch();

	// // todo storeToRefs as soon this data is actually fetched
	// const { corpusStatistics } = useCorporaStore();
	// const { getWordlist } = useWordlist();
	// todo implement proper mapping and returning of ifos
	/* eslint-disable */
	const getMediaSourceFrequencies = async (query: CorpusQuery) => {
		// doc.docsrc
		// query.loading.mediaSources = true;
		query.loading.mediaSources = true;

		const corpora = useCorporaStore();
		const { selectedCorpus } = storeToRefs(corpora);
		const { data: mediaSources } = await authenticatedFetch(FREQUENCIES_MULTI_LEVEL_URL, {
			params: {
				// todo Subcorpus
				corpname: selectedCorpus.value?.corpname,
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
				json: { "concordance_query": [{ "queryselector": "iqueryrow", iquery: query.userInput }] }
				//q: `${query.preparedQuery};${corpora.corporaForSearch};fttattr=doc.docsrc;fcrit=doc.id;flimit=0;format=json`,
			},
		});
		if (!mediaSources?.value) {
			query.loading.mediaSources = false;
			return console.error('error on MediaSources');
		}
		const mediaSourceData = mediaSources.value as FreqMLDocsRC

		console.log({ mediaSourceData, blocks: mediaSourceData.Blocks, items: mediaSourceData.Blocks[0].Items });

		const WordformData = mediaSourceData.Blocks[0].Items;
		WordformData.forEach(({ frq, Word, fpm }) => {
			query.data.mediaSources.push({
				media: Word[0].n,
				// todo absolute is here actually also a frequency
				absolute: frq,
				relative: fpm,
			});
		});

		query.loading.mediaSources = false;
	};

	return { getMediaSourceFrequencies };
}
// q: aword, [lemma = "leben"]; corpname = amc_3.2; fttattr = doc.year; fcrit
// aword%2C%20%5Bword%3D%22arbeit%22%5D;amc_3.2;;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
// aword,+[word="aasdf"];corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
