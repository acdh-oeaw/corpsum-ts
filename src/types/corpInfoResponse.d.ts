interface CorpInfoResponse {
	gramrels: Array<any>;
	diachronic?: any;
	encoding: string;
	unicameral: boolean;
	aligned_details: Array<any>;
	alsizes: Array<any>;
	termdef: string;
	newversion: string;
	wsattr: string;
	wsdef: string;
	is_error_corpus: boolean;
	subcorpora: Array<Subcorpora>;
	infohref: string;
	lposlist: Array<Array<string>>;
	compiled: string;
	structures: Array<Structure>;
	api_version: string;
	info: string;
	wsposlist: Array<any>;
	freqttattrs: Array<any>;
	tagsetdoc: string;
	aligned: Array<any>;
	structs: Array<any>;
	wposlist: Array<any>;
	lang: string;
	docstructure: string;
	name: string;
	shortref: string;
	sizes: Sizes;
	request: Request;
	righttoleft: boolean;
	attributes: Array<Attribute2>;
	subcorpattrs: Array<any>;
	maxdetail: number;
	errsetdoc: string;
}

interface Attribute2 {
	fromattr: string;
	id_range: number;
	dynamic: string;
	name: string;
	label: string;
}

interface Request {
	subcorpora: string;
	corpname: string;
	format: string;
}

interface Sizes {
	tokencount: string;
	sentcount: string;
	wordcount: string;
	normsum: string;
	parcount: string;
	doccount: string;
}

interface Structure {
	attributes: Array<Attribute>;
	name: string;
	label: string;
}

interface Attribute {
	fromattr: string;
	dynamic: string;
	name: string;
	label: string;
}

interface Subcorpora {
	tokens: number;
	relsize: number;
	user: number;
	words: number;
	n: string;
}
