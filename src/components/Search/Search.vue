<script lang="ts" setup>
import { useKeywordInContextSearch } from "../../composables/useKeywordInContextSearch";
import QueryItem from "./QueryItem.vue";

const query = useQuery();

const newSelectedType: Ref<CorpusQueryType> = ref("word");
const newUserInput = ref("");

const CORPUS_QUERY_TYPES = [
	{ value: "custom", description: "Custom search" },
	{ value: "lc", description: "Lemma C Search (ToDo)" },
	{ value: "lc*", description: "LemmaC with wildcard" },
	{ value: "lemma", description: "Lemma search" },
	{ value: "word", description: "Word Search" },
];

const { getYearlyFrequencies } = useYearlyFrequenciesSearch();
const { getWordFormFrequencies } = useWordFormsSearch();
const { getMediaSourceFrequencies } = useMediaSourceSearch();
const { getRegionsFrequencies } = useRegionsSearch();
const { getKeywordInContext } = useKeywordInContextSearch();
// getRegionsFrequencies
async function addQuery() {
	const addedQuery = query.addQuery(newUserInput.value, newSelectedType.value);
	// newSelectedType.value = "word";
	newUserInput.value = "";

	await getYearlyFrequencies(addedQuery);
	await getWordFormFrequencies(addedQuery);
	await getMediaSourceFrequencies(addedQuery);
	await getRegionsFrequencies(addedQuery);
	await getKeywordInContext(addedQuery);
}

const _alert = (msg: string) => {
	alert(msg);
};
</script>

<template>
	<VContainer>
		<div>
			<VForm @submit.prevent="addQuery">
				<div class="flex items-center gap-1">
					<CorpusSelection />

					<VSelect
						v-model="newSelectedType"
						:items="CORPUS_QUERY_TYPES"
						item-title="description"
						item-value="value"
						label="Query type"
						placeholder="select the Query type"
						style="flex-grow: 0"
						class="ml-4"
					></VSelect>
					<VTextField
						v-model="newUserInput"
						placeholder="your search term"
						vafriant="outlined"
						class="flex-1"
						append-inner-icon="mdi-send-circle"
						@keydown.enter="addQuery"
						@click:append-inner="addQuery"
					></VTextField>
					<!-- <v-btn variant="outlined">Add Query</v-btn> -->
				</div>
			</VForm>
		</div>
		<div class="mt-4 flex flex-wrap gap-4">
			<QueryItem v-for="(q, i) of query.queries" :key="i" :query="q"></QueryItem>
		</div>
	</VContainer>
</template>
