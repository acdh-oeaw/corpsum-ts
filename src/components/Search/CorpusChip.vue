<script setup lang="ts">
const props = defineProps<{ query: CorpusQuery }>();
</script>

<template>
	<VChip>
		{{ props.query.corpus }}
		{{ props.query.subCorpus ? ` / ${props.query.subCorpus}` : "" }}
	</VChip>
</template>
