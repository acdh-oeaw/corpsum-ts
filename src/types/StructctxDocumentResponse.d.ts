interface StructCtxDocumentResponse {
	wrapdetail: string;
	content: Array<StructCtxDocumentContent>;
	leftlink: string;
	rightlink: string;
	pos: number;
	maxcontext: number;
	no_display_links: boolean;
	api_version: string;
	manatee_version: string;
	request: Request;
}

interface Request {
	pos: string;
	q: string;
	format: string;
	struct: string;
}

interface StructCtxDocumentContent {
	str: string;
	class: string;
}
