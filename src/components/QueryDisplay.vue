<script lang="ts" setup>
withDefaults(defineProps<{ query: CorpusQuery; loading?: boolean }>(), {
	loading: false,
});
</script>

<template>
	<div class="my-1">
		<VProgressCircular
			v-if="loading"
			class="mr-1"
			:color="query.color"
			indeterminate
		></VProgressCircular>
		<span :style="`color: ${query.color}`">{{ query.type }}: {{ query.userInput }}</span>
		<CorpusChip class="ml-1" :query="query" />
	</div>
</template>
