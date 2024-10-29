<script lang="ts" setup>
import { useQueryStore } from "../stores/query";

definePageMeta({
	title: "Corpsum.meta.title",
});

const t = useTranslations("Corpsum");

const queryStore = useQueryStore();
</script>

<template>
	<MainContent class="container py-8">
		<ClientOnly>
			<VContainer>
				<h1>{{ t("title") }}</h1>
			</VContainer>

			<Search></Search>
		</ClientOnly>
	</MainContent>
</template>
