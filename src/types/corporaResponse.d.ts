/* eslint-disable @typescript-eslint/no-explicit-any */
interface CorporaInfo {
	data: Array<Corpus>;
	api_version: string;
	manatee_version: string;
	request: any;
}

interface Corpus {
	id?: any;
	owner_id?: any;
	owner_name?: any;
	tagset_id?: any;
	sketch_grammar_id?: any;
	term_grammar_id?: any;
	_is_sgdev: boolean;
	is_featured: boolean;
	access_on_demand: boolean;
	terms_of_use?: any;
	sort_to_end?: any;
	tags: Array<any>;
	created?: any;
	needs_recompiling: boolean;
	user_can_read: boolean;
	user_can_upload: boolean;
	user_can_manage: boolean;
	is_shared: boolean;
	is_error_corpus: boolean;
	corpname: string;
	language_id: string;
	language_name: string;
	sizes: Sizes;
	compilation_status: string;
	new_version: string;
	name: string;
	info: string;
	wsdef: string;
	termdef: string;
	diachronic: boolean;
	aligned: Array<any>;
	docstructure: string;
}

interface Sizes {
	tokencount: string;
	wordcount: string;
	doccount: string;
	parcount: string;
	sentcount: string;
	normsum?: string;
}
