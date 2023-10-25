interface YearlyFrequencyData {
	Blocks: Array<Block>;
	wllimit: number;
	request: Request;
	fullsize: number;
	FCrit: Array<FCrit>;
	lastpage: number;
	paging: number;
	fcrit: string;
	concsize: number;
	api_version: string;
}

interface FCrit {
	fcrit: string;
}

interface Request {
	ctxattrs: string;
	pagesize: string;
	format: string;
	gdexcnt: string;
	fttattr: string;
	gdexconf: string;
	flimit: string;
	kwicrightctx: string;
	q: string;
	viewmode: string;
	attrs: string;
	attr_tooltip: string;
	corpname: string;
	fcrit: string;
	structs: string;
	kwicleftctx: string;
}

interface Block {
	totalfrq: number;
	Head: Array<Head>;
	total: number;
	Items: Array<Item>;
}

interface Item {
	relbar: number;
	Word: Array<Word>;
	fbar: number;
	pfilter_list: Array<string>;
	freq: number;
	nfilter: string;
	pfilter: string;
	freqbar: number;
	rel: number;
	nbar: number;
	norm: number;
	norel: number;
}

interface Word {
	n: string;
}

interface Head {
	s: number | string;
	id?: string;
	n: string;
}
