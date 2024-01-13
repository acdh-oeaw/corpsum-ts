<script lang="ts" setup>
import { storeToRefs } from "pinia";

// const query = useQuery();
const corporaStore = useCorporaStore();

const { subCorporaLoading, corporaLoading } = storeToRefs(corporaStore);
</script>

<template>
	<div class="flex items-start gap-1">
		<!-- <VBtn @click="fetchCorpora()">refetch Corpora</VBtn> -->
		<div class="flex flex-col justify-start">
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
			<p v-if="corporaStore.selectedCorpus">
				tokencount: {{ corporaStore.selectedCorpus.sizes.tokencount }}
				<br />
				wordcount: {{ corporaStore.selectedCorpus.sizes.wordcount }}
				<br />
				doccount: {{ corporaStore.selectedCorpus.sizes.doccount }}
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
				label="Sub-Corpus"
				placeholder="select the Subcorpus or leave empty to query the whole corpus"
				style="flex-grow: 0; min-width: 10rem"
			></VAutocomplete>
			<p v-if="corporaStore.selectedSubCorpus">
				tokens: {{ corporaStore.selectedSubCorpus.tokens }}
				<br />
				words: {{ corporaStore.selectedSubCorpus.words }}
				<br />
			</p>
		</div>

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
