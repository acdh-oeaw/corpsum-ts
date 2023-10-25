interface KeywordInContextData {
	request: Request;
	Sort_idx: Array<any>;
	numofpages: number;
	Lines: Array<Line>;
	finished: number;
	sc_strcts: Array<Array<string>>;
	nextlink: string;
	q: Array<string>;
	righttoleft: boolean;
	numofcolls: number;
	fromp: number;
	gdex_scores: Array<any>;
	lastlink: string;
	relsize: number;
	Desc: Array<Desc>;
	concsize: number;
	port: number;
	api_version: string;
	fullsize: number;
}

interface Desc {
	nicearg: string;
	tourl: string;
	rel: number;
	arg: string;
	op: string;
	size: number;
}

interface Line {
	Right: Array<Right>;
	hitlen: number;
	Tbl_refs: Array<string>;
	linegroup: string;
	Kwic: Array<Right>;
	ref: string;
	toknum: number;
	Left: Array<Right>;
}

interface Right {
	class: string;
	str: string;
}

interface Request {
	ctxattrs: string;
	attr_tooltip: string;
	pagesize: string;
	format: string;
	gdexcnt: string;
	setrefs: Array<string>;
	gdexconf: string;
	kwicrightctx: string;
	q: string;
	viewmode: string;
	attrs: string;
	allpos: string;
	setattrs: string;
	async: string;
	newctxsize: string;
	structs: string;
	corpname: string;
	kwicleftctx: string;
}
