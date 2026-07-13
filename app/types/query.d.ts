type CorpusQueryType =
	import("~/lib/noske-types").components["parameters"]["127_concordance_query_queryselector"];

type CorpusQueryTypeValue = "char" | "cql" | "iquery" | "lemma" | "phrase" | "word";

type Region = "agesamt" | "amitte" | "aost" | "asuedost" | "awest" | "spezifisch";

type SearchFunctionKey =
	| "collocations"
	| "keywordInContext"
	| "mediaSources"
	| "mediaTypes"
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
	refs: Array<string>;
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

	mediaTypes: Array<{
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
	name?: string | undefined;
	label?: string | undefined;
	attributes?: Array<KWICAttribute> | undefined;
	size?: number | undefined;
}
interface KWICAttrsStructs {
	attributes: Array<string>;
	structures: Array<string>;
}

interface KWICAttrsStructsOptions {
	attributes: Array<KWICAttribute>;
	structures: Array<KWICStructure>;
}

type ConcordanceQuery = Record<"queryselector", CorpusQueryType> &
	Record<CorpusQueryTypeValue, string>;

interface FacettingRegexSearch {
	key: string;
	value: string;
}

type FacettingValues = Record<string, Array<string> | FacettingRegexSearch>;
interface CorpusQuery {
	id: number;
	noske?: string;
	type: CorpusQueryType;
	userInput: string;
	finalQuery: string;
	preparedQuery: string;
	color: string;
	showPicker: boolean;
	corpus: string;
	subCorpus: string;
	concordance_query: ConcordanceQuery;
	cattr?: string;
	KWICAttrsStructs: KWICAttrsStructs;
	KWICAdditionalViewHeaders: Array<string>;
	KWICAttrsStructsOptions: KWICAttrsStructsOptions;
	facettingValues: FacettingValues;
	SampleRatio: number;
	loading: {
		yearlyFrequencies: boolean;
		wordFormFrequencies: boolean;
		regionalFrequencies: boolean;
		keywordInContext: boolean;
		mediaSources: boolean;
		collocations: boolean;
	};
}

interface SubCorpus {
	tokens: number;
	relsize: number;
	user: number;
	words: number;
	n: string;
}

interface IsourceDistribution {
	media: string;
	absolute: number;
	relative: number;
}

interface RegionalFreqData {
	region: string;
	relative: number;
	absolute: number;
}
interface RegionalFrequency {
	data: Array<RegionalFreqData>;
	query: number;
}
