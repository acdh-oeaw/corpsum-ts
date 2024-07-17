type CorpusQueryType = "charrow" | "cqlrow" | "iqueryrow" | "lemmarow" | "phraserow" | "wordrow";

type CorpusQueryTypeValue = "char" | "cql" | "iquery" | "lemma" | "phrase" | "word";

type Region = "agesamt" | "amitte" | "aost" | "asuedost" | "awest" | "spezifisch";

type SearchFunctionKey =
	| "keywordInContext"
	| "mediaSources"
	| "regionalFrequencies"
	| "wordFormFrequencies"
	| "yearlyFrequencies";
interface KeywordInContext {
	date: string;
	source: string;
	region: string;
	left: string;
	word: string;
	right: string;
	docid: string;
	topic: string;
	toknum: number;
}
interface QueryData {
	yearlyFrequencies: Array<{
		year: number;
		absolute: number;
		relative: number;
	}>;

	mediaSources: Array<{
		media: string;
		absolute: number;
		relative: number;
	}>;

	wordFormFrequencies: Array<{
		word: string;
		absolute: number;
		relative: number;
	}>;

	regionalFrequencies: Array<{ absolute: number | null; relative: number | null; region: Region }>;

	keywordInContext: Array<KeywordInContext>;
}

type ConcordanceQuery = Record<"queryselector", CorpusQueryType> &
	Record<CorpusQueryTypeValue, string>;
interface CorpusQuery {
	id: number;
	type: CorpusQueryType;
	userInput: string;
	finalQuery: string;
	preparedQuery: string;
	color: string;
	showPicker: boolean;
	corpus: string;
	subCorpus: string;
	concordance_query: ConcordanceQuery;
	loading: {
		yearlyFrequencies: boolean;
		wordFormFrequencies: boolean;
		regionalFrequencies: boolean;
		keywordInContext: boolean;
		mediaSources: boolean;
	};
}

// structure taken from response
interface SubCorpus {
	tokens: number;
	relsize: number;
	user: number;
	words: number;
	n: string;
}
