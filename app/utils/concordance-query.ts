const concordanceInputKeys = {
	charrow: "char",
	cqlrow: "cql",
	iquery: "iquery",
	lemmarow: "lemma",
	phraserow: "phrase",
	wordrow: "word",
} satisfies Record<CorpusQueryType, CorpusQueryTypeValue>;

export function getConcordanceInputKey(type: CorpusQueryType): CorpusQueryTypeValue {
	return concordanceInputKeys[type];
}
