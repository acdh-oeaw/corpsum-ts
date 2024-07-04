<script lang="ts" setup>
import { storeToRefs } from "pinia";

// const query = useQuery();
const corporaStore = useCorporaStore();
const kwicStore = useKWICSettings();
const {  existingCorpusKWICSecetion, selectedAttributeKeys, selectedStructureKeys } = storeToRefs(kwicStore);
const { corpInfoResponse, corporaLoading } = storeToRefs(corporaStore);
const t = useTranslations("Corpsum");

</script>

<template>
	<VExpansionPanels v-if="!corporaLoading && corpInfoResponse">
		<VExpansionPanel>
			<VExpansionPanelTitle>{{t('Attributes and Structures')}}</VExpansionPanelTitle>
			<VExpansionPanelText>
						<div class="flex flex-row gap-3 w-full justify-start p-0">
			<VAutocomplete :label="t('Attributes')" dese clearable placeholer="please select" chips multiple v-model="selectedAttributeKeys" item-title="name" :items="corpInfoResponse.attributes" />

			<VAutocomplete :label="t('Structures')" dese clearable placeholer="please select" chips multiple v-model="selectedStructureKeys" item-title="name" :items="corpInfoResponse.structures" />
			<!-- <VCheckbox  v-model="selectedAttributeKeys"  v-for="attribute of corpInfoResponse.attributes" :key="attribute.name" :label="attribute.name" :value="attribute"></VCheckbox> -->
			</div>

				<VBtn>Reaload KWIC with selected Attributes</VBtn>
		</VExpansionPanelText>
	</VExpansionPanel>
	</VExpansionPanels>
</template>
