import { useCorporaStore } from "../stores/corpora";

export function useRegionsSearch() {
	const { FREQUENCIES_MULTI_LEVEL_URL } = useAPIs();
	// const queryStore = useQuery();

	const { authenticatedFetch } = useAuthenticatedFetch();

	const escapeZeroSafe = (input: unknown) => (typeof input === "number" ? input : null);

	const getRegionsFrequencies = async (query: CorpusQuery) => {
		query.loading.regionalFrequencies = true;
		const corpora = useCorporaStore();
		/* eslint-disable */
		const { data: regionsData } = await authenticatedFetch(FREQUENCIES_MULTI_LEVEL_URL, {
			params: {
				// @ts-ignore
				...corpora.corporaForSearchKeys.value,
				format: "json",
				fmaxitems: 5000,
				fpage: 1,
				freq_sort: "freq",
				group: 0,
				showpoc: 1,
				showreltt: 1,
				showrel: 1,
				freqlevel: 1,
				ml1attr: "doc.region",
				ml1ctx: "0~0 > 0",
				json: { concordance_query: [{ queryselector: "iqueryrow", iquery: query.userInput }] },
			},
		});

		if (!regionsData.value) {
			query.loading.regionalFrequencies = false;
			return console.error("error on fetching freqml regions");
		}
		const freqmlRegionData = regionsData.value as unknown as FreqMLRegionResponse;
		query.data.regionalFrequencies = (
			freqmlRegionData.Blocks[0] ?? { Items: [] as Array<FreqMLRegion> }
		).Items.map((regionalData: FreqMLRegion) => ({
			region: regionalData.Word[0]?.n as unknown as Region,
			absolute: escapeZeroSafe(regionalData.frq),
			relative: escapeZeroSafe(regionalData.fpm),
		}));

		query.loading.regionalFrequencies = false;
	};

	return { getRegionsFrequencies };
}
// q: aword, [lemma = "leben"]; corpname = amc_3.2; fttattr = doc.year; fcrit
// aword%2C%20%5Bword%3D%22arbeit%22%5D;amc_3.2;;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
// aword,+[word="aasdf"];corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
