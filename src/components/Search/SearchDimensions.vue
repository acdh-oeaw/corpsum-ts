<script lang="ts" setup>
import { storeToRefs } from "pinia";

const t = useTranslations("Corpsum");

const searchSettings = useSearchSettingsStore();
const { selectedSearches, possibleSearchKeys } = storeToRefs(searchSettings);
</script>

<template>
	<VAutocomplete
		v-model="selectedSearches"
		chips
		clearable
		closable-chips
		:items="possibleSearchKeys"
		:label="t('SearchDimensions')"
		multiple
	>
		<template #chip="{ props, item }">
			<VChip v-bind="props" :text="t(item.value)"></VChip>
		</template>

		<template #item="{ props, item }">
			<!-- @vue-ignore i18n typing doesn't seem to work for templated strings -->
			<VListItem
				v-bind="props"
				:subtitle="t(`${item.value}Desc`)"
				:title="t(item.value)"
			></VListItem>
		</template>
	</VAutocomplete>
</template>
