// https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/corp_info?corpname=amc_3.2;subcorpora=1;format=json

export function useAPIs() {
	const config = useRuntimeConfig();

	const BASE_URL = config.public.apiBaseUrl;
	//const BASE_CORPUS =

	// https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/corp_info?corpname=amc_3.2;subcorpora=1;format=json
	const SUB_CORPUS_URL = `${BASE_URL}/run.cgi/corp_info`;

	// frequencies
	// used for temporal and for regional data
	// https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/freqtt?q=aword%2C%5Bword%3D%22arbeit%22%5D;corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
	const FREQUENCIES_URL = `${BASE_URL}/run.cgi/freqtt`;

	// todo this is something else, prob docs, but not entirely sure yet
	// https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/collx?q=aword%2C%5Bword%3D%22arbeit%22%5D%20within%20%3Cdoc%20year%3D%222017%22%2F%3E;corpname=amc_3.2;cfromw=-5;ctow=5;cminfreq=5;cminbgr=3;cmaxitems=10;cbgrfns=d;csortfn=d;format=json
	//const FREQUENCIES_URL = `${BASE_URL}/run.cgi/collx`

	const WORD_FORMS_URL = `${BASE_URL}/run.cgi/freqs`;

	// used for region and keywrdInContext
	const VIEWSATTRSX_URL = `${BASE_URL}/run.cgi/viewattrsx`;

	// for keywrdInContext details for a document
	// https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/structctx?corpname=amc_3.2;pos=489439339;struct=doc;format=json

	const SOURCES_URL = `${BASE_URL}/run.cgi/structctx`;

	const SOURCES_WORDLIST_URL = `${BASE_URL}/run.cgi/wordlist`;

	return {
		BASE_URL,
		SUB_CORPUS_URL,
		FREQUENCIES_URL,
		WORD_FORMS_URL,
		SOURCES_WORDLIST_URL,
		VIEWSATTRSX_URL,
		SOURCES_URL,
	};
}
