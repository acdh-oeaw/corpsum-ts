<script lang="ts" setup>
import FetchErrorAlert from "@/components/fetch-error-alert.vue";
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
		<template v-for="(query, index) of queries" :key="query.id">
			<div class="space-y-1">
				<QueryDisplay class="my-0" :loading="loading[index]" :query="query" />
				<FetchErrorAlert v-if="errors[index]" :message="errors[index]" />
			</div>
		</template>
	</div>
</template>
