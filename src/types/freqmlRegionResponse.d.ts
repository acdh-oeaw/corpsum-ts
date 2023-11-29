interface FreqMLRegionResponse {
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
	concordance_query: Array<Concordancequery>;
	results_url: string;
	corpname: string;
	ml1attr: string;
	format: string;
	showrel: string;
	json: string;
	fmaxitems: string;
	freq_sort: string;
	fpage: string;
	showpoc: string;
	group: string;
	showreltt: string;
	ml1ctx: string;
	freqlevel: string;
}

interface Concordancequery {
	queryselector: string;
	iquery: string;
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
	Items: Array<FreqMLRegion>;
}

interface FreqMLRegion {
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
