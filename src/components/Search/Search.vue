<script lang="ts" setup>
import QueryItem from "./QueryItem.vue";
import SearchDimensions from "./SearchDimensions.vue";

const query = useQuery();

const newSelectedType: Ref<CorpusQueryType> = ref("iqueryrow");
const newUserInput = ref("");

const CORPUS_QUERY_TYPES = [
	// { value: "charrow", description: "Character Search" },
	{ value: "cqlrow", description: "Custom Query Lang Search" },
	{ value: "iqueryrow", description: "Simplie Search (iquery)" },
	{ value: "lemmarow", description: "Lemma Search" },
	{ value: "phraserow", description: "Phrase search" },
	{ value: "wordrow", description: "Word search" },
];

const searchSettings = useSearchSettingsStore();
// getRegionsFrequencies
async function addQuery() {
	const addedQuery = query.addQuery(newUserInput.value, newSelectedType.value);
	// newSelectedType.value = "word";
	newUserInput.value = "";
	await searchSettings.doSearches(addedQuery);
}

const _alert = (msg: string) => {
	alert(msg);
};
</script>

<template>
	<VContainer>
		<div>
			<VForm @submit.prevent="addQuery">
				<div class="flex items-start gap-1">
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
		<SearchDimensions />
		<div class="mt-4 grid grid-cols-2 gap-1">
			<QueryItem v-for="(q, i) of query.queries" :key="i" :query="q"></QueryItem>
		</div>
	</VContainer>
</template>
