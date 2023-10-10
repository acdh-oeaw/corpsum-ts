<script lang="ts" setup>
// const query = useQuery();
const corporaStore = useCorporaStore();
</script>

<template>
	<div class="flex items-center gap-1">
		<v-select
			v-model="corporaStore.selectedCorpus"
			:items="corporaStore.corpora"
			item-title="name"
			return-object
			label="Corpus"
			placeholder="select the Corpus"
			style="flex-grow: 0; min-width: 15rem"
		></v-select>

		<v-autocomplete
			v-model="corporaStore.selectedSubCorpus"
			:items="corporaStore.subCorpora"
			item-title="n"
			item-value="n"
			dese
			return-object
			:clearable="true"
			label="Sub-Corpus"
			placeholder="select the Subcorpus or leave empty to query the whole corpus"
			style="flex-grow: 0; min-width: 10rem"
		></v-autocomplete>

		<!-- <v-btn variant="outlined">Add Query</v-btn> -->
	</div>
	<!-- <p>
				{{ corporaStore.selectedCorpus }}
			</p>
		-->
	<!-- <p>
		{{ corporaStore.selectedSubCorpus }}
	</p> -->
</template>
