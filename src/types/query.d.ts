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


interface KWICAttribute {
	name: string;
	id_range?: number;
	label: string;
	dynamic: string;
	fromattr: string;
	size?: string;
}

interface KWICStructure {
	name: string;
	label: string;
	attributes: Array<KWICAttribute>;
	size: string;
}
interface KWICAttrsStructs {
	attributes: Array<KWICAttribute>;
	structures: Array<KWICStructure>;
}

type ConcordanceQuery = Record<"queryselector", CorpusQueryType> &
	Record<CorpusQueryTypeValue, string>;

interface FacettingRegexSearch {
	key: string;
	value: string;
}

type FacettingValues = Record<string, Array<string> | FacettingRegexSearch>
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
	KWICAttrsStructs: KWICAttrsStructs;
	KWICAttrsStructsOptions: KWICAttrsStructs; // ToDo: this will be refactored to come from a query. -> will eb deleted
	facettingValues: FacettingValues;
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
