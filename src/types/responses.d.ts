interface YearlyFrequencyData {
	fcrit: string;
	FCrit: Array<FCrit>;
	Blocks: Array<Block>;
	paging: number;
	concsize: number;
	fullsize: number;
	Desc: Array<Desc>;
	numofcolls: number;
	hitlen: number;
	wllimit: number;
	lastpage: number;
	ml: boolean;
	api_version: string;
	manatee_version: string;
	request: Request;
}

interface Request {
	concordance_query: Concordancequery;
	fpage: string;
	freqlevel: string;
	json: string;
	format: string;
	freq_sort: string;
	corpname: string;
	showpoc: string;
	showrel: string;
	ml1attr: string;
	ml1ctx: string;
	showreltt: string;
	usecorp: string;
	group: string;
}

interface Concordancequery {
	iquery: string;
	queryselector: string;
}

interface Desc {
	op: string;
	arg: string;
	nicearg: string;
	rel: number;
	size: number;
	tourl: string;
}

interface Block {
	Head: Array<Head>;
	total: number;
	totalfrq: number;
	Items: Array<Item>;
}

interface Item {
	Word: Array<Word>;
	frq: number;
	norm: number;
	rel: number;
	reltt: number;
	fbar: number;
	relbar: number;
	freqbar: number;
	pfilter: string;
	nfilter: string;
	pfilter_list: Array<string>;
	poc: number;
	fpm: number;
}

interface Word {
	n: string;
}

interface Head {
	n: string;
	s: number | string;
	id?: string;
}

interface FCrit {
	fcrit: string;
}
