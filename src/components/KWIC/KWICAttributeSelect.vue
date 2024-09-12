<script lang="ts" setup>
import { storeToRefs } from "pinia";

// const query = useQuery();
const corporaStore = useCorporaStore();
const { corpInfoResponse, corporaLoading } = storeToRefs(corporaStore);
const t = useTranslations("Corpsum");

const props = defineProps<{ query: CorpusQuery }>();

const queryStore = useQueryStore();

const _query = queryStore.queries.find((q) => q.id === props.query.id);

const structureOptions = computed(() => {
	const options: Array<string> = [];
	_query?.KWICAttrsStructsOptions.structures.forEach((structure) => {
		if (!structure.name) return;
		options.push(structure.name);
		if (structure.attributes && _query.KWICAttrsStructs.structures.includes(structure.name)) {
			structure.attributes.forEach((attribute) => {
				options.push(`${structure.name}.${attribute.name}`);
			});
		}
	});
	return options ?? [];
});

const attributeOptions = computed(
	() => _query?.KWICAttrsStructsOptions.attributes.map((structure) => structure.name) ?? [],
);

const fixed = queryStore.fixedKWICStructures;
</script>

<template>
	<div v-if="!corporaLoading && corpInfoResponse">
		<h2 class="text-lg">{{ t("Attributes and Structures") }}</h2>
		<div v-if="_query" class="flex w-full flex-row justify-start gap-3 p-0">
			<VAutocomplete
				v-model="_query.KWICAttrsStructs.attributes"
				chips
				class="flex-1"
				closable-chips
				density="compact"
				item-title="name"
				:items="attributeOptions"
				:label="t('Attributes')"
				multiple
				placeholer="please select"
			>
				<template #item="{ props, item }">
					<VListItem
						:class="{ 'ml-4': item.raw.includes('.') }"
						density="compact"
						v-bind="props"
					></VListItem>
				</template>
			</VAutocomplete>

			<VAutocomplete
				v-model="_query.KWICAttrsStructs.structures"
				chips
				class="flex-1"
				closable-chips
				density="compact"
				item-title="name"
				:items="structureOptions"
				:label="t('Structures')"
				multiple
				placeholer="please select"
			>
				<template #item="{ props, item }">
					<VListItem
						checkbox
						:class="{ 'ml-4': item.raw.includes('.') }"
						density="compact"
						:disabled="fixed.includes(item.raw)"
						v-bind="props"
					></VListItem>
				</template>
			</VAutocomplete>
		</div>
	</div>
</template>
