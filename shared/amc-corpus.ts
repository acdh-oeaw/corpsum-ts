export const amcCorpusPattern = /^amc(?:_|$|\d+(?:[._-]|$))/iu;

export function isAmcCorpus(corpus: string) {
	return amcCorpusPattern.test(corpus);
}
