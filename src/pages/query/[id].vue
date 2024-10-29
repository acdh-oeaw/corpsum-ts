<script lang="ts" setup>
definePageMeta({
	title: "Corpsum.meta.title",
});
const t = useTranslations("Corpsum");
</script>

<template>
	<MainContent class="container py-8">
		<ClientOnly>
			<VContainer>
				<h1>{{ t("title") }}</h1>
			</VContainer>
		</ClientOnly>
	</MainContent>
</template>
