// https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/corp_info?corpname=amc_3.2;subcorpora=1;format=json

export function useAPIs() {
	const config = useRuntimeConfig();

	const BASE_URL: string = config.public.apiBaseUrl;

	// run.cgi/corpora
	const CORPORA_LIST_URL = `${BASE_URL}/run.cgi/corpora`;

	// https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/corp_info?corpname=amc_3.2;subcorpora=1;format=json
	const SUB_CORPUS_URL = `${BASE_URL}/run.cgi/corp_info`;
	// params: {
	// 	corpname: selectedCorpus.value.corpname,
	// 	subcorpora: 1,
	// 	format: "json",
	// },
	const CREATE_SUBCORPUS_URL = `${BASE_URL}/run.cgi/subcorp`;
	// frequencies
	// used for yearly and for media sources
	// https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/freqtt?q=aword%2C%5Bword%3D%22arbeit%22%5D;corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
	const FREQUENCIES_TIME_URL = `${BASE_URL}/run.cgi/freqtt`;
	const FREQUENCIES_MULTI_LEVEL_URL = `${BASE_URL}/run.cgi/freqml`;

	// media sources:
	// q: `${query.preparedQuery};${corpora.corporaForSearch};fttattr=doc.docsrc;fcrit=doc.id;flimit=0;format=json`,

	// yearly Frequencies:
	// q: `${query.preparedQuery};${corpora.corporaForSearch};fttattr=doc.year;fcrit=doc.id;flimit=0;format=json`,

	// used for region and keywrdInContext
	const CINCORDANCE_URL = `${BASE_URL}/run.cgi/concordance`;
	// region param:
	// q: `aword,${query.finalQuery} within <doc region="${region}"/>;${corporaForSearch.value};attrs=word;viewmode=kwic;ctxattrs=word;setattrs=word;allpos=kw;setrefs==doc.id;setrefs==doc.region;pagesize=10;newctxsize=5;async=0;format=json`,

	// keyword in context params:
	// q: `${query.preparedQuery};${corporaForSearch.value};viewmode=kwic;attrs=word;ctxattrs=word;setattrs=word;allpos=kw;setrefs==doc.id;setrefs==doc.datum;setrefs==doc.region;setrefs==doc.ressort2;setrefs==doc.docsrc_name;pagesize=1000;newctxsize=30;async=0;format=json`,

	// for keywrdInContext details for a document
	const STRUCTCTX_URL = `${BASE_URL}/run.cgi/structctx`;

	// https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/structctx?corpname=amc_3.2;pos=489439339;struct=doc;format=json

	const WORDLIST_URL = `${BASE_URL}/run.cgi/wordlist`;
	// https://noske-amc.acdh.oeaw.ac.at/bonito/run.cgi/wordlist?corpname=amc4_demo&results_url=https%3A%2F%2Fnoske-amc.acdh.oeaw.ac.at%2Fcrystal%2F%23wordlist%3Fcorpname%3Damc4_demo%26tab%3Dbasic%26find%3Dlemma%26keyword%3Dauto%26filter%3Dcontaining%26wlminfreq%3D0%26include_nonwords%3D1%26itemsPerPage%3D50%26cols%3D%255B%2522frq%2522%255D%26showresults%3D1&wlmaxitems=20000&wlsort=frq&wlattr=lemma&wlpat=(.*auto.*)&wlminfreq=0&wlicase=1&wlmaxfreq=0&wltype=simple&include_nonwords=1&random=0&relfreq=1&reldocf=1&wlpage=1


	const FULL_REF_URL = `${BASE_URL}/run.cgi/fullref`;


	const FACETTING_URL = `${BASE_URL}/run.cgi/texttypes_with_norms`
	const ATTR_VALS_URL = `${BASE_URL}/run.cgi/attr_vals`

	return {
		BASE_URL,
		SUB_CORPUS_URL,
		FREQUENCIES_TIME_URL,
		WORDLIST_URL,
		CINCORDANCE_URL,
		CORPORA_LIST_URL,
		FREQUENCIES_MULTI_LEVEL_URL,
		STRUCTCTX_URL,
		CREATE_SUBCORPUS_URL,
		FULL_REF_URL,
		FACETTING_URL,
		ATTR_VALS_URL,
	};
}
