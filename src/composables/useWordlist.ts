// this file incoperates the actual search for the yearly frequency data
import { storeToRefs } from "pinia";
import { type Ref, ref } from "vue";

export function useWordlist() {
	const { WORDLIST_URL } = useAPIs();

	const corporaStore = useCorporaStore();
	const { selectedCorpus } = storeToRefs(corporaStore);

	const { authenticatedFetch } = useAuthenticatedFetch();

	// as in old application
	// const wordlistDocsrcURI = `${engineAPI}wordlist?corpname=${selectedCorpus};wlmaxitems=1000;wlattr=doc.docsrc;wlminfreq=1;include_nonwords=1;wlsort=f;wlnums=docf;format=json`;

	// todo adapt type here
	const wordlist: Ref<Array<string> | null> = ref(null);
	const loading = ref(false);
	async function refreshWordlist() {
		if (!selectedCorpus.value) return console.error("no corpus selected");
		if (loading.value) return console.error("no corpus selected");
		loading.value = true;
		// todo adapt to weird format everything under corpname?
		const { data: response } = await authenticatedFetch(WORDLIST_URL, {
			params: {
				corpname: selectedCorpus.value.corpname,
				wlmaxitems: 1000,
				wlattr: "doc.docsrc",
				wlminfreq: 1,
				include_nonwords: 1,
				wlsort: "f",
				wlnums: "docf",
				format: "json",
			},
		});
		wordlist.value = response as unknown as Array<string>;
		// eslint-disable-next-line require-atomic-updates
		loading.value = false;
	}

	const getWordlist = async () => {
		// console.log('wordlist.value', wordlist.value);
		if (!wordlist.value) await refreshWordlist();
		return wordlist.value;
	};
	//await refreshWordlist();
	return { wordlist, refreshWordlist, getWordlist, loading };
}
// q: aword, [lemma = "leben"]; corpname = amc_3.2; fttattr = doc.year; fcrit
// aword%2C%20%5Bword%3D%22arbeit%22%5D;amc_3.2;;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
// aword,+[word="aasdf"];corpname=amc_3.2;fttattr=doc.year;fcrit=doc.id;flimit=0;format=json
