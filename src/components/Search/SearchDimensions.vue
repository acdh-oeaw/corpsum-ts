<script lang="ts" setup>
import { storeToRefs } from "pinia";

const searchSettings = useSearchSettingsStore();
const { selectedSearches, possibleSearchKeys } = storeToRefs(searchSettings);
</script>

<template>
	<VAutocomplete
		v-model="selectedSearches"
		label="Search Dimensions"
		multiple
		closable-chips
		clearable
		chips
		:items="possibleSearchKeys"
	/>
</template>
