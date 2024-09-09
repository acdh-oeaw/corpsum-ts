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

function addQuery() {
	query.addQuery(newUserInput.value, newSelectedType.value);
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
						class="ml-4"
						item-title="description"
						item-value="value"
						:items="CORPUS_QUERY_TYPES"
						:label="t('querytype')"
						style="flex-grow: 0"
					></VSelect>
					<VTextField
						v-model="newUserInput"
						append-inner-icon="mdi-send-circle"
						class="flex-1"
						:placeholder="t('SearchTerm')"
						vafriant="outlined"
						@click:append-inner="addQuery"
						@keydown.enter="addQuery"
					></VTextField>
				</div>
			</VForm>
		</div>
		<SearchDimensions />
		<div class="mt-4 grid grid-cols-2 gap-1">
			<QueryItem v-for="q of query.queries" :key="q.id" :query="q"></QueryItem>
		</div>
	</VContainer>
</template>
