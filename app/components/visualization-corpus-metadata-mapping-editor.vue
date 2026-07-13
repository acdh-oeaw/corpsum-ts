<script setup lang="ts">
import type {
	CorpusMetadataMappingLookupResponse,
	CorpusMetadataSemantic,
} from "@/lib/visualization-types";

const props = defineProps<{
	queries: Array<CorpusQuery>;
	semantic: CorpusMetadataSemantic;
}>();

const emit = defineEmits<{
	updated: [];
}>();

const { mappingLookupsByKey, refreshMappings, uniqueMappingQueries } =
	await useCorpusMetadataMappings(
		() => props.queries,
		() => props.semantic,
	);

const mappingDrafts = ref<Record<string, string>>({});
const mappingErrors = ref<Record<string, string>>({});
const mappingSaving = ref<Record<string, boolean>>({});

watchEffect(() => {
	for (const query of uniqueMappingQueries.value) {
		const key = createCorpusMetadataMappingKey(query, props.semantic);
		if (mappingDrafts.value[key]) continue;
		mappingDrafts.value[key] = JSON.stringify(
			createMappingDraft(mappingLookupsByKey.value[key]),
			null,
			2,
		);
	}
});

function createMappingDraft(lookup: CorpusMetadataMappingLookupResponse | undefined) {
	const mapping = lookup?.resolved;
	return mapping
		? {
				attribute: mapping.attribute,
				parser: mapping.parser,
				valueMap: mapping.valueMap,
				label: mapping.label ?? "Temporal distribution",
				description: mapping.description ?? "",
			}
		: {
				attribute: "doc.year",
				parser: { mode: "year", sourceUnit: "year" },
				valueMap: {},
				label: "Temporal distribution",
				description: "",
			};
}

function getMappingActionLabel(query: CorpusQuery) {
	const lookup = mappingLookupsByKey.value[createCorpusMetadataMappingKey(query, props.semantic)];
	if (lookup?.user) return "Save private mapping";
	if (lookup?.canEditDefault) return "Save default mapping";
	return "Save private copy";
}

async function saveMapping(query: CorpusQuery, forceUserCopy = false) {
	const key = createCorpusMetadataMappingKey(query, props.semantic);
	const noske = query.noske;
	if (!noske) return;
	mappingErrors.value = { ...mappingErrors.value, [key]: "" };
	mappingSaving.value = { ...mappingSaving.value, [key]: true };
	try {
		const parsed = JSON.parse(mappingDrafts.value[key] ?? "{}") as Record<string, unknown>;
		const lookup = mappingLookupsByKey.value[key];
		const target = !forceUserCopy && lookup?.canEditDefault ? lookup.default : lookup?.user;
		const body = {
			noske,
			corpus: query.corpus,
			semantic: props.semantic,
			scope: forceUserCopy || !lookup?.canEditDefault ? "user" : "default",
			attribute: parsed.attribute,
			parser: parsed.parser,
			valueMap: parsed.valueMap ?? {},
			label: parsed.label,
			description: parsed.description,
		};
		if (target) {
			await $fetch(`/api/corpus-metadata-mappings/${target._id}`, {
				method: "PATCH",
				body,
			});
		} else {
			await $fetch("/api/corpus-metadata-mappings", {
				method: "POST",
				body,
			});
		}
		await refreshMappings();
		emit("updated");
	} catch (error) {
		mappingErrors.value = {
			...mappingErrors.value,
			[key]: error instanceof Error ? error.message : "Could not save mapping.",
		};
	} finally {
		mappingSaving.value = { ...mappingSaving.value, [key]: false };
	}
}

function hasDefaultMapping(query: CorpusQuery) {
	return Boolean(
		mappingLookupsByKey.value[createCorpusMetadataMappingKey(query, props.semantic)]?.default,
	);
}

function hasUserMapping(query: CorpusQuery) {
	return Boolean(
		mappingLookupsByKey.value[createCorpusMetadataMappingKey(query, props.semantic)]?.user,
	);
}
</script>

<template>
	<div class="grid gap-3 rounded-md border p-3">
		<div>
			<p class="text-sm font-medium">Corpus metadata mappings</p>
			<p class="text-xs text-muted-foreground">{{ semantic }}</p>
		</div>

		<p v-if="uniqueMappingQueries.length === 0" class="text-sm text-muted-foreground">
			Select a query with a corpus before editing metadata mappings.
		</p>

		<div
			v-for="query in uniqueMappingQueries"
			:key="createCorpusMetadataMappingKey(query, semantic)"
			class="grid gap-2"
		>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<Label :for="`mapping-${createCorpusMetadataMappingKey(query, semantic)}`">
					{{ query.corpus }} metadata mapping
				</Label>
				<div class="flex flex-wrap gap-1 text-xs text-muted-foreground">
					<span v-if="hasUserMapping(query)">Private</span>
					<span v-else-if="hasDefaultMapping(query)">Default</span>
					<span v-else>Missing</span>
				</div>
			</div>
			<textarea
				:id="`mapping-${createCorpusMetadataMappingKey(query, semantic)}`"
				v-model="mappingDrafts[createCorpusMetadataMappingKey(query, semantic)]"
				class="min-h-44 rounded-md border bg-background p-3 font-mono text-xs"
			></textarea>
			<p
				v-if="mappingErrors[createCorpusMetadataMappingKey(query, semantic)]"
				class="text-xs text-destructive"
			>
				{{ mappingErrors[createCorpusMetadataMappingKey(query, semantic)] }}
			</p>
			<div class="flex flex-wrap gap-2">
				<Button
					class="w-fit"
					:disabled="mappingSaving[createCorpusMetadataMappingKey(query, semantic)]"
					size="sm"
					type="button"
					@click="saveMapping(query)"
				>
					{{
						mappingSaving[createCorpusMetadataMappingKey(query, semantic)]
							? "Saving..."
							: getMappingActionLabel(query)
					}}
				</Button>
				<Button
					v-if="!hasUserMapping(query) && hasDefaultMapping(query)"
					:disabled="mappingSaving[createCorpusMetadataMappingKey(query, semantic)]"
					size="sm"
					type="button"
					variant="outline"
					@click="saveMapping(query, true)"
				>
					Save private copy
				</Button>
			</div>
		</div>
	</div>
</template>
