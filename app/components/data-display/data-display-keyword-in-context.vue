<script lang="ts" setup>
import { getKWICqueryAttrStrcs, getQueryWithFacetting } from "@/utils/corpus-query";
import type { components } from "~/lib/noske-types";

type ConcordanceResponse = components["schemas"]["06_concordance"];

const props = withDefaults(
	defineProps<{
		queries: Array<CorpusQuery>;
		data?: Array<ConcordanceResponse | null | undefined>;
		interactive?: boolean;
		showHeader?: boolean;
	}>(),
	{
		data: undefined,
		interactive: true,
		showHeader: true,
	},
);

const t = useTranslations();
const queries = computed(() => props.queries);
const usesProvidedData = computed(() => props.data !== undefined);
const queryDescriptors = computed<Array<NoskeConcordanceQueryDescriptor>>(() =>
	queries.value.map((query) => {
		const attrsAndStructures = getKWICqueryAttrStrcs(query);
		const refs = query.KWICAttrsStructs.structures.map((structure) => `=${structure}`).join(",");
		const facetedQuery = getQueryWithFacetting(query);
		const params = {
			viewmode: "kwic" as const,
			attrs: attrsAndStructures.attrs,
			structs: attrsAndStructures.structs,
			refs,
			pagesize: 1000,
			format: "json" as const,
		};
		const queryKey = [
			"get-concordance",
			query.noske,
			query.corpus,
			query.subCorpus,
			params,
			JSON.stringify(facetedQuery),
		] as const;
		return {
			queryKey,
			noske: query.noske ?? "",
			enabled: !usesProvidedData.value && Boolean(query.noske),
			params: {
				corpname: query.corpus,
				usesubcorp: query.subCorpus || undefined,
				...params,
				json: JSON.stringify({ concordance_query: facetedQuery }),
			},
		};
	}),
);

const queryResults = useNoskeConcordanceQueries(queryDescriptors);
const concordanceData = computed(() =>
	usesProvidedData.value
		? queries.value.map((_, index) => props.data?.[index])
		: queryResults.value.map((result) => result.data),
);
const concordanceLoading = computed(() =>
	usesProvidedData.value
		? queries.value.map(() => false)
		: queryResults.value.map((result) => result.isFetching || result.isLoading),
);
const concordanceErrors = computed(() =>
	queries.value.map((_, index) => {
		if (usesProvidedData.value) return null;
		const result = queryResults.value[index];
		if (!result?.isError) return null;
		return result.data === undefined
			? t("DataDisplayErrors.keywordInContext.loadFailed")
			: t("DataDisplayErrors.keywordInContext.refreshFailed");
	}),
);
</script>

<template>
	<Card>
		<CardHeader v-if="showHeader">
			<CardTitle>{{ t("keywordInContext") }}</CardTitle>
			<CardDescription>{{ t("keywordInContextDesc") }}</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div v-if="concordanceErrors.some(Boolean)" class="space-y-2">
				<div
					v-for="(query, index) of queries"
					v-show="concordanceErrors[index]"
					:key="query.id"
					class="rounded-md border border-destructive/50 bg-destructive/5 p-3"
				>
					<QueryDisplay class="my-0" :query="query" />
					<p class="mt-1 text-sm text-destructive" role="alert">
						{{ concordanceErrors[index] }}
					</p>
				</div>
			</div>

			<KwicQueryDisplay
				v-for="(query, index) of queries"
				:key="query.id"
				:data="concordanceData[index]"
				:interactive="interactive"
				:loading="concordanceLoading[index]"
				:query="query"
				:query-key="queryDescriptors[index]?.queryKey"
			/>
		</CardContent>
	</Card>
</template>
