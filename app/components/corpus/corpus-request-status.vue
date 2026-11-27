<script setup lang="ts">
import { CircleAlert, Loader2 } from "lucide-vue-next";

const props = defineProps<{
	label: string;
	loading?: boolean;
	failed?: boolean;
	cache?: NoskeCacheMetadata;
}>();

const t = useTranslations();
const locale = useLocale();
const fetchedAt = computed(() => {
	const timestamp = props.cache?.fetchedAt;
	if (!timestamp) return;
	const date = new Date(timestamp);
	if (Number.isNaN(date.getTime())) return;
	return new Intl.DateTimeFormat(locale.value, {
		dateStyle: "short",
		timeStyle: "medium",
	}).format(date);
});
</script>

<template>
	<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" role="status">
		<Loader2 v-if="loading" class="size-4 shrink-0 motion-safe:animate-spin" aria-hidden="true" />
		<CircleAlert v-else-if="failed" class="size-4 shrink-0 text-destructive" aria-hidden="true" />
		<span :class="failed ? 'text-destructive' : 'text-muted-foreground'">{{ label }}</span>
		<template v-if="cache && !loading && !failed">
			<span class="text-muted-foreground">{{
				t(`NoskeInstanceDetail.cache.${cache.status}`)
			}}</span>
			<span v-if="fetchedAt" class="text-muted-foreground">{{ fetchedAt }}</span>
			<span v-if="Number.isFinite(cache.upstreamDurationMs)" class="text-muted-foreground">
				{{ cache.upstreamDurationMs }} ms
			</span>
		</template>
	</div>
</template>
