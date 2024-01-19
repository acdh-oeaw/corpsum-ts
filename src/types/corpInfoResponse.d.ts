/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @interface
 * Response Schema for SketchEngines corp_info endpoint
 * Custom written as the actual response does  not fully match the response
 * described here https://www.sketchengine.eu/apidoc/#/Corpus%20Search/get_search_corp_info
 */
interface CorpInfoResponse {
	aligned: Array<any>;
	aligned_details: Array<any>;
	alsizes: Array<any>;
	api_version: string;
	attributes: Array<Attribute>;
	compiled: string;
	diachronic?: any;
	docstructure: string;
	encoding: string;
	errsetdoc: string;
	freqttattrs: Array<any>;
	gramrels: Array<any>;
	info: string;
	infohref: string;
	is_error_corpus: boolean;
	lang: string;
	lposlist: Array<Array<string>>;
	maxdetail: number;
	name: string;
	newversion: string;
	request: Request;
	righttoleft: boolean;
	shortref: string;
	sizes: Sizes;
	structs: Array<any>;
	structures: Array<Structure>;
	subcorpattrs: Array<any>;
	subcorpora: Array<Subcorpora>;
	tagsetdoc: string;
	termdef: string;
	unicameral: boolean;
	wposlist: Array<any>;
	wsattr: string;
	wsdef: string;
	wsposlist: Array<any>;
}

interface Request {
	corpname: string;
	format: string;
	subcorpora: string;
}

interface Sizes {
	doccount: string;
	normsum: string;
	parcount: string;
	sentcount: string;
	tokencount: string;
	wordcount: string;
}

interface Structure {
	attributes: Array<Attribute>;
	label: string;
	name: string;
}

interface Attribute {
	dynamic: string;
	fromattr: string;
	id_range?: number;
	label: string;
	name: string;
}

interface Subcorpora {
	n: string;
	relsize: number;
	tokens: number;
	user: number;
	words: number;
}
