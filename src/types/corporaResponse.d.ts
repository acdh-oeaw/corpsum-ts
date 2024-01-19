/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @interface
 * Response Schema for SketchEngines corpora endpoint
 * Custom written as the actual response does  not fully match the response
 * described here https://www.sketchengine.eu/apidoc/#/Corpora/get_ca_api_corpora
 */
interface CorporaInfo {
	api_version: string;
	data: Array<Corpus>;
	manatee_version: string;
	request: any;
}

interface Corpus {
	_is_sgdev: boolean;
	access_on_demand: boolean;
	aligned: Array<any>;
	compilation_status: string;
	corpname: string;
	created?: any;
	diachronic: boolean;
	docstructure: string;
	id?: any;
	info: string;
	is_error_corpus: boolean;
	is_featured: boolean;
	is_shared: boolean;
	language_id: string;
	language_name: string;
	name: string;
	needs_recompiling: boolean;
	new_version: string;
	owner_id?: any;
	owner_name?: any;
	sizes: Sizes;
	sketch_grammar_id?: any;
	sort_to_end?: any;
	tags: Array<any>;
	tagset_id?: any;
	term_grammar_id?: any;
	termdef: string;
	terms_of_use?: any;
	user_can_manage: boolean;
	user_can_read: boolean;
	user_can_upload: boolean;
	wsdef: string;
}

interface Sizes {
	doccount: string;
	normsum?: string;
	parcount: string;
	sentcount: string;
	tokencount: string;
	wordcount: string;
}
