<script lang="ts" setup>
import type { QueryKey } from "@tanstack/vue-query";
import { CircleAlert, Loader2, RefreshCw } from "lucide-vue-next";

const props = withDefaults(
	defineProps<{
		query: CorpusQuery;
		loading?: boolean;
		error?: string | null;
		queryKey?: QueryKey;
	}>(),
	{
		loading: false,
		error: null,
	},
);

const t = useTranslations();

const { metadata, refresh } = useNoskeCacheMetadata(computed(() => props.queryKey));

const cacheLabel = computed(() => {
	const current = metadata.value;
	if (!current) return "";
	const fetchedAt = current.fetchedAt ? formatCacheDate(current.fetchedAt) : "";
	const duration =
		typeof current.upstreamDurationMs === "number" ? `, ${current.upstreamDurationMs} ms` : "";
	const prefix = current.status === "hit" ? "cache hit" : current.status;
	return fetchedAt ? `${prefix}: ${fetchedAt}${duration}` : prefix;
});

async function refreshQuery() {
	if (!props.queryKey) return;
	await refresh(props.queryKey);
}

function formatCacheDate(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "short",
		timeStyle: "medium",
	}).format(date);
}
</script>

<template>
	<div class="my-1 flex flex-wrap items-center gap-2">
		<Loader2
			v-if="loading"
			class="size-4 animate-spin"
			:aria-label="t('QueryDataStatus.loading')"
			:style="{ color: query.color }"
		/>
		<CircleAlert v-else-if="error" class="size-4 text-destructive" aria-hidden="true" />
		<span :style="{ color: query.color }">{{ query.type }}: {{ query.userInput }}</span>
		<CorpusChip class="ml-1" :query="query" />
		<span v-if="error" class="text-xs text-destructive" role="status">{{ error }}</span>
		<span v-if="cacheLabel" class="text-xs text-muted-foreground">{{ cacheLabel }}</span>
		<Button
			v-if="queryKey"
			:disabled="loading"
			size="icon"
			type="button"
			variant="ghost"
			@click="refreshQuery"
		>
			<RefreshCw class="size-4" />
			<span class="sr-only">Refresh NoSketch result</span>
		</Button>
	</div>
</template>
