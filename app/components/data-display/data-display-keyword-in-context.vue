<script lang="ts" setup>
import { storeToRefs } from "pinia";

const t = useTranslations();
const queryStore = useQueryStore();

const { queries } = storeToRefs(queryStore);
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
