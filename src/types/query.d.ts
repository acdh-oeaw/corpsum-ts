type CorpusQueryType = "custom" | "lc" | "lc*" | "lemma" | "word";

type Region = "amitte" | "aost" | "asuedost" | "awest";

interface QueryData {
	yearlyFrequencies: Array<{
		year: number;
		absolute: number;
		relative: number;
	}>;

	wordFormFrequencies: Array<{
		word: string;
		absolute: number;
		relative: number;
	}>;

	regionalFrequencies: Record<Region, { absolute: number | null; relative: number | null }>;

	keywordInContext: Array<{
		date: string;
		source: string;
		region: string;
		left: string;
		word: string;
		right: string;
		docid: string;
		topic: string;
		toknum: number;
	}>;
}
interface CorpusQuery {
	id: number;
	type: CorpusQueryType;
	userInput: string;
	finalQuery: string;
	preparedQuery: string;
	color: string;
	showPicker: boolean;

	loading: {
		yearlyFrequencies: boolean;
		formFrequencies: boolean;
		regionalFrequencies: boolean;
		keywordInContext: boolean;
		mediaSources: boolean;
	};

	data: QueryData;
}

// structure taken from response
interface SubCorpus {
	tokens: number;
	relsize: number;
	user: number;
	words: number;
	n: string;
}
