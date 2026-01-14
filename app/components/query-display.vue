<script lang="ts" setup>
import { Loader2 } from "lucide-vue-next";

withDefaults(defineProps<{ query: CorpusQuery; loading?: boolean }>(), {
	loading: false,
});
</script>

<template>
	<div class="my-1 flex items-center gap-2">
		<Loader2 v-if="loading" class="size-4 animate-spin" :style="{ color: query.color }" />
		<span :style="{ color: query.color }">{{ query.type }}: {{ query.userInput }}</span>
		<CorpusChip class="ml-1" :query="query" />
	</div>
</template>
