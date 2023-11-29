// https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/corp_info?corpname=amc_3.2;subcorpora=1;format=json

export function useAPIs() {
	const config = useRuntimeConfig();

	const BASE_URL = config.public.apiBaseUrl as string;

	// run.cgi/corpora
	const CORPORA_LIST_URL = `${BASE_URL}/run.cgi/corpora`;

	// https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/corp_info?corpname=amc_3.2;subcorpora=1;format=json
	const SUB_CORPUS_URL = `${BASE_URL}/run.cgi/corp_info`;
	// params: {
	// 	corpname: selectedCorpus.value.corpname,
	// 	subcorpora: 1,
	// 	format: "json",
	// },

	// frequencies
	// used for yearly and for media sources
	// https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/freqtt?q=aword%2C%5Bword%3D%22arbeit%22%5D;corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
	const FREQUENCIES_URL = `${BASE_URL}/run.cgi/freqtt`;
	const FREQUENCIES_MULTI_LEVEL_URL = `${BASE_URL}/run.cgi/freqml`;
	// media sources:
	// q: `${query.preparedQuery};${corpora.corporaForSearch};fttattr=doc.docsrc;fcrit=doc.id;flimit=0;format=json`,

	// yearly Frequencies:
	// q: `${query.preparedQuery};${corpora.corporaForSearch};fttattr=doc.year;fcrit=doc.id;flimit=0;format=json`,

	// todo this is something else, prob docs, but not entirely sure yet
	// https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/collx?q=aword%2C%5Bword%3D%22arbeit%22%5D%20within%20%3Cdoc%20year%3D%222017%22%2F%3E;corpname=amc_3.2;cfromw=-5;ctow=5;cminfreq=5;cminbgr=3;cmaxitems=10;cbgrfns=d;csortfn=d;format=json
	//const FREQUENCIES_URL = `${BASE_URL}/run.cgi/collx`

	// for word forms
	const WORD_FORMS_URL = `${BASE_URL}/run.cgi/freqs`;
	// q: `${query.preparedQuery};${corpora.corporaForSearch};fcrit=word/e 0~0>0;flimit=0;format=json`,

	// used for region and keywrdInContext
	const VIEWSATTRSX_URL = `${BASE_URL}/run.cgi/concordance`;
	// region param:
	// q: `aword,${query.finalQuery} within <doc region="${region}"/>;${corporaForSearch.value};attrs=word;viewmode=kwic;ctxattrs=word;setattrs=word;allpos=kw;setrefs==doc.id;setrefs==doc.region;pagesize=10;newctxsize=5;async=0;format=json`,

	// keyword in context params:
	// q: `${query.preparedQuery};${corporaForSearch.value};viewmode=kwic;attrs=word;ctxattrs=word;setattrs=word;allpos=kw;setrefs==doc.id;setrefs==doc.datum;setrefs==doc.region;setrefs==doc.ressort2;setrefs==doc.docsrc_name;pagesize=1000;newctxsize=30;async=0;format=json`,

	// for keywrdInContext details for a document
	// (not implemented yet)
	const SOURCES_URL = `${BASE_URL}/run.cgi/structctx`;
	// https://corpsum-proxy.acdh-dev.oeaw.ac.at/run.cgi/structctx?corpname=amc_3.2;pos=489439339;struct=doc;format=json

	const WORDLIST_URL = `${BASE_URL}/run.cgi/wordlist`;
	// https://noske-amc.acdh.oeaw.ac.at/bonito/run.cgi/wordlist?corpname=amc4_demo&results_url=https%3A%2F%2Fnoske-amc.acdh.oeaw.ac.at%2Fcrystal%2F%23wordlist%3Fcorpname%3Damc4_demo%26tab%3Dbasic%26find%3Dlemma%26keyword%3Dauto%26filter%3Dcontaining%26wlminfreq%3D0%26include_nonwords%3D1%26itemsPerPage%3D50%26cols%3D%255B%2522frq%2522%255D%26showresults%3D1&wlmaxitems=20000&wlsort=frq&wlattr=lemma&wlpat=(.*auto.*)&wlminfreq=0&wlicase=1&wlmaxfreq=0&wltype=simple&include_nonwords=1&random=0&relfreq=1&reldocf=1&wlpage=1

	/**
	 * corpname: amc4_demo
	results_url: https://noske-amc.acdh.oeaw.ac.at/crystal/#wordlist?corpname=amc4_demo&tab=basic&find=lemma&keyword=auto&filter=containing&wlminfreq=0&include_nonwords=1&itemsPerPage=50&cols=%5B%22frq%22%5D&showresults=1
	wlmaxitems: 20000
	wlsort: frq
	wlattr: lemma
	wlpat: (.*auto.*)
	wlminfreq: 0
	wlicase: 1
	wlmaxfreq: 0
	wltype: simple
	include_nonwords: 1
	random: 0
	relfreq: 1
	reldocf: 1
	wlpage: 1
	 *
	 */



	// wordlist params:
	// (maybe adapt to same format as old corpsum where everything is under corpname param)
	// params: {
	// 	corpname: selectedCorpus.value.corpname,
	// 	wlmaxitems: 1000,
	// 	wlattr: "doc.docsrc",
	// 	wlminfreq: 1,
	// 	include_nonwords: 1,
	// 	wlsort: "f",
	// 	wlnums: "docf",
	// 	format: "json",
	// },

	return {
		BASE_URL,
		SUB_CORPUS_URL,
		FREQUENCIES_URL,
		WORD_FORMS_URL,
		WORDLIST_URL,
		VIEWSATTRSX_URL,
		SOURCES_URL,
		CORPORA_LIST_URL,
		FREQUENCIES_MULTI_LEVEL_URL,
	};
}
