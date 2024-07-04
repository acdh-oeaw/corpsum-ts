<script lang="ts" setup>
import { storeToRefs } from "pinia";

// const query = useQuery();
const corporaStore = useCorporaStore();

const { corpInfoResponse, corporaLoading, selectedCorpusKWICViewInfo,  existingCorpusKWICSecetion } = storeToRefs(corporaStore);
const t = useTranslations("Corpsum");

const selectedScructs=ref([]);
const selectedAttrs=ref([]);
</script>

<template>
	<div class="flex items-start gap-1" v-if="!corporaLoading && corpInfoResponse">
		<div class="flex flex-col justify-start p-0">
			<h2>Attributes</h2>
			<VCheckbox  v-model="selectedCorpusKWICViewInfo.attributes"  v-for="attribute of corpInfoResponse.attributes" :key="attribute.name" :label="attribute.name" :value="attribute"></VCheckbox>
		</div>
			{{ selectedCorpusKWICViewInfo.attributes }}
				<div class="flex flex-col justify-start p-0">
			<h2>Structures</h2>
			<VCheckbox v-model="selectedCorpusKWICViewInfo.structures"  v-for="structure of corpInfoResponse.structures" :key="structure.name" :label="structure.name" :value="structure"></VCheckbox>

			{{ selectedCorpusKWICViewInfo.structures }}
		</div>

		existingCorpusKWICSecetion
		{{ existingCorpusKWICSecetion }}
	</div>
</template>
