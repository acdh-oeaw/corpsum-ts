interface FreqsResponseData {
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
	q: string;
	corpname: string;
	format: string;
	flimit: string;
	fcrit: string;
}

interface Block {
	totalfrq: number;
	Head: Array<Head>;
	total: number;
	Items: Array<Item>;
}

interface Item {
	pfilter: string;
	Word: Array<Word>;
	fbar: number;
	pfilter_list: Array<string>;
	frq: number;
	nfilter: string;
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
