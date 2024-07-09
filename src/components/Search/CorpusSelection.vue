<script lang="ts" setup>
import {useQuery} from "@tanstack/vue-query";
import { storeToRefs } from "pinia";

const api = useApiClient();

const corporaStore = useCorporaStore();
const { selectedCorpus, selectedSubCorpus } = storeToRefs(corporaStore);

const subCorpFetchingIsEnabled = computed(() => selectedCorpus.value !== null );

const { data: corpora, isPending: corporaLoading } = useQuery({
	placeholderData: {data: []},
	queryKey: ["get-corpora"] as const,
	async queryFn() {
		const response = await api.ca.getCorpora();
		return response.data;
	},
});

const { data: subCorpora, isPending: subCorporaLoading } = useQuery({
	enabled: subCorpFetchingIsEnabled.value,
	queryKey: ["get-corp-info", selectedCorpus] as const,
	queryFn: async () => {
		const response = await api.search.getCorpInfo({
			/** @ts-ignore undefined prevented through subCorpFetchingIsEnabled **/
			corpname: selectedCorpus.value?.name,
			subcorpora: 1,
		});
		return response.data;
	},
});

const t = useTranslations("Corpsum");
</script>

<template>
	<div class="flex items-start gap-1">
		<div class="flex flex-col justify-start">
			<VSelect
				v-model="selectedCorpus"
				:loading="corporaLoading"
				:items="corpora!.data!"
				item-title="name"
				:return-object="true"
				:label="t('Corpus')"
				:no-data-text="t('NoData')"
				style="flex-grow: 0; min-width: 15rem"
				@update:model-value="selectedSubCorpus = null"
			></VSelect>
			<p v-if="corporaStore.selectedCorpus">
				{{ corporaStore.selectedCorpus?.info }}
				<br />
				{{ t("tokencount") }}: {{ corporaStore.selectedCorpus?.sizes?.tokencount }}
				<br />
				{{ t("wordcount") }}: {{ corporaStore.selectedCorpus?.sizes?.wordcount }}
				<br />
				{{ t("doccount") }}: {{ corporaStore.selectedCorpus?.sizes?.doccount }}
			</p>
		</div>
		<div class="flex h-full flex-col items-start justify-start">
			<VAutocomplete
				v-model="corporaStore.selectedSubCorpus"
				:items="subCorpora?.subcorpora"
				:loading="subCorporaLoading"
				item-title="name"
				item-value="name"
				dese
				:return-object="true"
				:clearable="true"
				:label="t('SubCorpus')"
				:placeholder="t('SelectSubCorpus')"
				:no-data-text="t('NoData')"
				style="flex-grow: 0; min-width: 10rem"
			></VAutocomplete>
			<p v-if="corporaStore.selectedSubCorpus">
				tokens: {{ corporaStore.selectedSubCorpus?.tokens }}
				<br />
				words: {{ corporaStore.selectedSubCorpus?.words }}
				<br />
			</p>
		</div>
	</div>
</template>
