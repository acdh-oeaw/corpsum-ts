<script lang="ts" setup>
import { storeToRefs } from "pinia";

// const query = useQuery();
const corporaStore = useCorporaStore();
const kwicSettingsStore = useKWICSettings();
const { existingCorpusKWICSecetion, selectedCorpusKWICViewInfo } = storeToRefs(kwicSettingsStore);
const { corpInfoResponse, corporaLoading } = storeToRefs(corporaStore);
const t = useTranslations("Corpsum");
const search = useSearchSettingsStore();
</script>

<template>
	<div v-if="!corporaLoading && corpInfoResponse">
		<h2 class="text-lg">{{ t("Attributes and Structures") }}</h2>

		<div class="flex w-full flex-row justify-start gap-3 p-0">
			<VAutocomplete
				v-model="selectedCorpusKWICViewInfo.attributes"
				:label="t('Attributes')"
				return-object
				dese
				closable-chips
				placeholer="please select"
				chips
				multiple
				item-title="name"
				:items="corpInfoResponse.attributes"
			/>

			<VAutocomplete
				v-model="selectedCorpusKWICViewInfo.structures"
				:label="t('Structures')"
				return-object
				dese
				closable-chips
				placeholer="please select"
				chips
				multiple
				item-title="name"
				:items="corpInfoResponse.structures"
			/>
		</div>

		<VBtn @click="search.doSearchesForAllQueries(['keywordInContext'])">
			{{ t("Reload KWIC with selected Attributes") }}
		</VBtn>
		<!-- {{ existingCorpusKWICSecetion }} -->
	</div>
</template>
