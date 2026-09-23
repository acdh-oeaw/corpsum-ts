<script lang="ts" setup>
const props = defineProps<{
	queries: Array<CorpusQuery>;
	loading: Array<boolean>;
	errors: Array<string | null>;
}>();

const emit = defineEmits<{
	"loading-change": [loading: boolean];
}>();

const t = useTranslations();

const hasStatus = computed(() =>
	props.queries.some((_, index) => props.loading[index] || props.errors[index]),
);
const hasLoading = computed(() => props.loading.some(Boolean));

watch(hasLoading, (value) => emit("loading-change", value), { immediate: true });
</script>

<template>
	<div
		v-show="hasStatus"
		class="space-y-1 rounded-md border bg-muted/20 p-2"
		aria-live="polite"
		:aria-label="t('QueryDataStatus.label')"
		role="region"
	>
		<QueryDisplay
			v-for="(query, index) of queries"
			:key="query.id"
			class="my-0"
			:error="errors[index]"
			:loading="loading[index]"
			:query="query"
		/>
	</div>
</template>
