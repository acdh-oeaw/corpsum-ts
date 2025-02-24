<script lang="ts" setup>
defineRouteRules({
	prerender: true,
});

const t = useTranslations();

usePageMetadata({
	title: t("ImprintPage.meta.title"),
});
</script>

<template>
	<MainContent class="mx-auto grid content-start gap-y-8 py-8 max-lg:container">
		<PageTitle>{{ t("ImprintPage.title") }}</PageTitle>
		<Imprint />
	</MainContent>
</template>
