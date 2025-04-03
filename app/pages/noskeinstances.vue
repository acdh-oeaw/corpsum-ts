<script lang="ts" setup>
const { data: message } = await useFetch("/api/noskeinstances", {});
</script>

<template>
	<MainContent class="container grid content-start gap-y-8 py-8">
		<PageTitle>{{ message }}</PageTitle>
	</MainContent>
</template>
