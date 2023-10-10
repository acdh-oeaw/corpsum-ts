<script lang="ts" setup>
definePageMeta({
	title: "IndexPage.meta.title",
});

const t = useTranslations("IndexPage");
</script>

<template>
	<MainContent class="container py-8">
		<h1>{{ t("title") }}</h1>
		<v-icon icon="mdi-home" />
		okay
	</MainContent>
</template>
