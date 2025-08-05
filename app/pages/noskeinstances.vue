<script lang="ts" setup>
import NoskeInstanceCard from "@/components/noskeinstance/noske-instance-card.vue";

const t = useTranslations();
const { data: instances } = await useFetch("/api/noskeinstances", {});
</script>

<template>
	<MainContent class="">
		<PageTitle>{{ t("NoskeInstancesPage.title") }}</PageTitle>
		<div class="flex flex-wrap gap-3">
			<NoskeInstanceCard v-for="(instance, index) in instances" :key="index" :noske-instance="instance" />
		</div>
	</MainContent>
</template>
