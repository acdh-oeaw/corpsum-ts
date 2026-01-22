<script setup lang="ts">
const t = useTranslations();
const route = useRoute();

const visualizationId = computed(() => {
	const idParam = route.params.id;
	return Array.isArray(idParam) ? idParam[0] : idParam;
});

const { data: visualization } = await useFetch(() => `/api/visualization/${visualizationId.value}`);
</script>

<template>
	<MainContent class="mx-auto w-full max-w-5xl">
		<div class="my-10 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
					<LucideIcon class="size-8 text-foreground" name="ChartColumn" :stroke-width="2" />
				</div>
				<PageTitle>{{ visualization?.name || t("VisualizationsPage.detailTitle") }}</PageTitle>
			</div>
		</div>
	</MainContent>
</template>
