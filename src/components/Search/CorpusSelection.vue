<script lang="ts" setup>
import { storeToRefs } from "pinia";

// const query = useQuery();
const corporaStore = useCorporaStore();

const { subCorporaLoading, corporaLoading } = storeToRefs(corporaStore);
const t = useTranslations("Corpsum");
</script>

<template>
	<div class="flex items-start gap-1">
		<div class="flex flex-col justify-start">
			<VSelect
				v-model="corporaStore.selectedCorpus"
				:loading="corporaLoading"
				:items="corporaStore.corpora"
				item-title="name"
				return-object
				:label="t('Corpus')"
				:no-data-text="t('NoData')"
				style="flex-grow: 0; min-width: 15rem"
			></VSelect>
			<p v-if="corporaStore.selectedCorpus">
				{{ t("tokencount") }}: {{ corporaStore.selectedCorpus?.sizes.tokencount }}
				<br />
				{{ t("wordcount") }}: {{ corporaStore.selectedCorpus?.sizes.wordcount }}
				<br />
				{{ t('doccount') }}: {{ corporaStore.selectedCorpus?.sizes.doccount }}
			</p>
		</div>
		<div class="flex h-full flex-col items-start justify-start">
			<VAutocomplete
				v-model="corporaStore.selectedSubCorpus"
				:items="corporaStore.subCorpora"
				:loading="subCorporaLoading"
				item-title="name"
				item-value="name"
				dese
				return-object
				:clearable="true"
				:label="t('SubCorpus')"
				:placeholder="t('SelectSubCorpus')"
				:no-data-text="t('NoData')"
				style="flex-grow: 0; min-width: 10rem"
			></VAutocomplete>
			<p v-if="corporaStore.selectedSubCorpus">
				tokens: {{ corporaStore.selectedSubCorpus.tokens }}
				<br />
				words: {{ corporaStore.selectedSubCorpus.words }}
				<br />
			</p>
		</div>
	</div>
</template>
