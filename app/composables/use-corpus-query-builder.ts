import { reactive } from "vue";

import type { QueryExecutionFields } from "@/lib/query-execution";
import { colors } from "@/utils/colors";
import { getConcordanceInputKey } from "@/utils/concordance-query";
import { buildFinalQuery, normalizeFacettingValues } from "@/utils/corpus-query";

export function useCorpusQueryBuilder() {
	function buildCorpusQuery(item: QueryExecutionFields, index: number): CorpusQuery {
		const finalQuery = buildFinalQuery(item.type, item.userInput);
		const concordance_query = {
			queryselector: item.type,
			[getConcordanceInputKey(item.type)]: item.userInput,
		} as ConcordanceQuery;

		return reactive({
			id: index,
			noske: item.noske,
			type: item.type,
			userInput: item.userInput,
			finalQuery,
			preparedQuery: `aword,${finalQuery}`,
			color: colors[index % colors.length] ?? "#111827",
			showPicker: false,
			corpus: item.corpus,
			subCorpus: item.subCorpus,
			concordance_query,
			KWICAttrsStructs: { attributes: [], structures: [] },
			KWICAttrsStructsOptions: {
				attributes: [],
				structures: [],
			},
			KWICAdditionalViewHeaders: [],
			facettingValues: normalizeFacettingValues(item.facettingValues),
			SampleRatio: 100,
			loading: {
				yearlyFrequencies: false,
				wordFormFrequencies: false,
				regionalFrequencies: false,
				keywordInContext: false,
				mediaSources: false,
				collocations: false,
			},
		});
	}

	return {
		buildCorpusQuery,
	};
}
