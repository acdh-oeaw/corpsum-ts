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
	>
		<template v-slot:chip="{ props, item }">
			<VChip v-bind="props" :text="t(item.value)"></VChip>
		</template>

		<template v-slot:item="{ props, item }">
			<!-- @vue-ignore -->
			<VListItem
				v-bind="props"
				:title="t(item.value)"
				:subtitle="t(`${item.value}Desc`)"
			></VListItem>
		</template>
	</VAutocomplete>
</template>
