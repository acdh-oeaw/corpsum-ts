<script lang="ts" setup>
import { fixedKWICStructures } from "@/utils/corpus-query";

const t = useTranslations();

const props = defineProps<{ query: CorpusQuery }>();

const currentQuery = computed(() => props.query);

const structureOptions = computed(() => {
	const options: Array<string> = [];
	currentQuery.value?.KWICAttrsStructsOptions.structures.forEach((structure) => {
		if (!structure.name) return;
		options.push(structure.name);
		if (
			structure.attributes &&
			currentQuery.value?.KWICAttrsStructs.structures.includes(structure.name)
		) {
			structure.attributes.forEach((attribute) => {
				options.push(`${structure.name}.${attribute.name}`);
			});
		}
	});
	return options ?? [];
});

const attributeOptions = computed(
	() =>
		currentQuery.value?.KWICAttrsStructsOptions.attributes.map((structure) => structure.name) ?? [],
);

const toggleSelection = (
	list: Array<string>,
	value: string,
	checked: boolean | "indeterminate",
) => {
	if (checked) {
		if (!list.includes(value)) list.push(value);
		return;
	}
	const index = list.indexOf(value);
	if (index >= 0) list.splice(index, 1);
};
</script>

<template>
	<div v-if="currentQuery">
		<h2 class="text-lg font-semibold">{{ t("Attributes and Structures") }}</h2>
		<div class="mt-4 grid gap-6 md:grid-cols-2">
			<div class="space-y-3">
				<h3 class="text-sm font-medium text-muted-foreground">{{ t("Attributes") }}</h3>
				<div class="space-y-2 rounded-md border p-3">
					<div
						v-for="attribute in attributeOptions"
						:key="attribute"
						class="flex items-center gap-2"
					>
						<Checkbox
							:aria-label="attribute"
							:model-value="currentQuery.KWICAttrsStructs.attributes.includes(attribute)"
							@update:model-value="
								toggleSelection(currentQuery.KWICAttrsStructs.attributes, attribute, $event)
							"
						/>
						<span class="text-sm">{{ attribute }}</span>
					</div>
				</div>
			</div>

			<div class="space-y-3">
				<h3 class="text-sm font-medium text-muted-foreground">{{ t("Structures") }}</h3>
				<div class="space-y-2 rounded-md border p-3">
					<div
						v-for="structure in structureOptions"
						:key="structure"
						class="flex items-center gap-2"
						:class="{ 'pl-4': structure.includes('.') }"
					>
						<Checkbox
							:aria-label="structure"
							:model-value="currentQuery.KWICAttrsStructs.structures.includes(structure)"
							:disabled="fixedKWICStructures.some((fixed) => fixed === structure)"
							@update:model-value="
								toggleSelection(currentQuery.KWICAttrsStructs.structures, structure, $event)
							"
						/>
						<span class="text-sm">{{ structure }}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
