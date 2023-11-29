<script lang="ts" setup>
import { storeToRefs } from "pinia";

// const query = useQuery();
const corporaStore = useCorporaStore();
async function fetchCorpora() {
	await corporaStore.fetchCorpora();
}

const { subCorporaLoading, corporaLoading } = storeToRefs(corporaStore);
</script>

<template>
	<div class="flex items-center gap-1">
		<!-- <VBtn @click="fetchCorpora()">refetch Corpora</VBtn> -->
		<VSelect
			v-model="corporaStore.selectedCorpus"
			:loading="corporaLoading"
			:items="corporaStore.corpora"
			item-title="name"
			return-object
			label="Corpus"
			placeholder="select the Corpus"
			style="flex-grow: 0; min-width: 15rem"
		></VSelect>
		<VAutocomplete
			v-model="corporaStore.selectedSubCorpus"
			:items="corporaStore.subCorpora"
			:loading="subCorporaLoading"
			item-title="name"
			item-value="name"
			dese
			return-object
			:clearable="true"
			label="Sub-Corpus"
			placeholder="select the Subcorpus or leave empty to query the whole corpus"
			style="flex-grow: 0; min-width: 10rem"
		></VAutocomplete>
		<!-- {{ !selectedCorpus }} {{ subCorporaLoading }} -->

		<!-- <v-btn variant="outlined">Add Query</v-btn> -->
	</div>
	<!-- <p>
		{{ corporaStore.selectedCorpus }}
	</p> -->
	<!-- <p>
		{{ corporaStore.selectedSubCorpus }}
	</p> -->
</template>
