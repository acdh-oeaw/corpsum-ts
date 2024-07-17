<script lang="ts" setup>
import QueryItem from "./QueryItem.vue";
import SearchDimensions from "./SearchDimensions.vue";

const query = useQueryStore();
const t = useTranslations("Corpsum");

const newSelectedType: Ref<CorpusQueryType> = ref("iqueryrow");
const newUserInput = ref("");

const CORPUS_QUERY_TYPES = [
	{ value: "iqueryrow", description: t("iqueryrow") },
	{ value: "wordrow", description: t("wordrow") },
	{ value: "lemmarow", description: t("lemmarow") },
	{ value: "phraserow", description: t("phraserow") },
	{ value: "cqlrow", description: t("cqlrow") },
];

const searchSettings = useSearchSettingsStore();
// getRegionsFrequencies
async function addQuery() {
	const addedQuery = query.addQuery(newUserInput.value, newSelectedType.value);
	// newSelectedType.value = "word";
	newUserInput.value = "";
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
						:label="t('querytype')"
						style="flex-grow: 0"
						class="ml-4"
					></VSelect>
					<VTextField
						v-model="newUserInput"
						:placeholder="t('SearchTerm')"
						vafriant="outlined"
						class="flex-1"
						append-inner-icon="mdi-send-circle"
						@keydown.enter="addQuery"
						@click:append-inner="addQuery"
					></VTextField>
				</div>
			</VForm>
		</div>
		<SearchDimensions />
		<div class="mt-4 grid grid-cols-2 gap-1">
			<QueryItem v-for="(q, i) of query.queries" :key="i" :query="q"></QueryItem>
		</div>
	</VContainer>
</template>
