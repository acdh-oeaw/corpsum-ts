<script lang="ts" setup>
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

const t = useTranslations();
const { data: instancesData, refresh } = useGetNoskeinstances(null);
const instances = computed<Array<PopulatedNoskeDocument>>(() => {
	if (!instancesData.value) return [];
	return Array.isArray(instancesData.value) ? instancesData.value : [instancesData.value];
});

function handleDeleted() {
	void refresh();
}
</script>

<template>
	<MainContent class="">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<PageTitle>{{ t("NoskeInstancesPage.title") }}</PageTitle>
			<Button as-child>
				<NuxtLinkLocale :href="{ path: '/noskeinstance/edit/new' }">New instance</NuxtLinkLocale>
			</Button>
		</div>
		<div class="mt-4 flex flex-wrap gap-3">
			<NoskeInstanceCard
				v-for="instance in instances"
				:key="instance._id"
				:noske-instance="instance"
				@deleted="handleDeleted"
			/>
		</div>
	</MainContent>
</template>
