<script setup lang="ts">
const props = defineProps<{ query: CorpusQuery }>();
</script>

<template>
	<Badge variant="secondary">
		{{ props.query.corpus }}{{ props.query.subCorpus ? ` / ${props.query.subCorpus}` : "" }}
	</Badge>
</template>
