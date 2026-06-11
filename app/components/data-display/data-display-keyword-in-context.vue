<script lang="ts" setup>
const t = useTranslations();

defineProps<{
	queries: Array<CorpusQuery>;
}>();
</script>

<template>
	<Card>
		<CardHeader>
			<CardTitle>{{ t("keywordInContext") }}</CardTitle>
			<CardDescription>{{ t("keywordInContextDesc") }}</CardDescription>
		</CardHeader>
		<CardContent>
			<div v-for="query in queries" :key="query.id">
				<kwicQueryDisplay :query="query" />
			</div>
		</CardContent>
	</Card>
</template>
