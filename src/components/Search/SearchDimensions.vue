<script lang="ts" setup>
import { storeToRefs } from "pinia";

const t = useTranslations("Corpsum");

const searchSettings = useSearchSettingsStore();
const { selectedSearches, possibleSearchKeys } = storeToRefs(searchSettings);
</script>

<template>
	<VAutocomplete
		v-model="selectedSearches"
		:label="t('SearchDimensions')"
		multiple
		closable-chips
		clearable
		chips
		:items="possibleSearchKeys"
	/>
</template>
