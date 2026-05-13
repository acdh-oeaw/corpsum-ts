<script lang="ts" setup>
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

interface CredentialListItem {
	noskeinstance: string;
	noskeName: string;
	username: string;
}

const t = useTranslations();
const { data: instancesData, refresh } = useGetNoskeinstances(null);
const { data: credentials } = await useFetch<Array<CredentialListItem>>("/api/credentials", {
	default: () => [],
});
const instances = computed<Array<PopulatedNoskeDocument>>(() => {
	if (!instancesData.value) return [];
	return Array.isArray(instancesData.value) ? instancesData.value : [instancesData.value];
});
const credentialIds = computed(() => {
	return new Set((credentials.value ?? []).map((credential) => credential.noskeinstance));
});

function handleDeleted() {
	void refresh();
}
</script>

<template>
	<MainContent class="w-full min-w-0">
		<div class="my-10 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
					<LucideIcon class="size-8 text-foreground" name="Database" :stroke-width="2" />
				</div>
				<PageTitle>{{ t("NoskeInstancesPage.title") }}</PageTitle>
			</div>
			<div class="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
				<Button as-child size="sm" variant="ghost">
					<NuxtLinkLocale :href="{ path: '/noskeinstance/edit/new' }">
						<LucideIcon class="mr-1 size-4" name="Plus" :stroke-width="2" />
						{{ t("Actions.newInstance") }}
					</NuxtLinkLocale>
				</Button>
			</div>
		</div>
		<div class="mt-4 flex flex-wrap gap-3">
			<NoskeInstanceCard
				v-for="instance in instances"
				:key="instance._id"
				:has-credentials="credentialIds.has(instance._id)"
				:noske-instance="instance"
				@deleted="handleDeleted"
			/>
		</div>
	</MainContent>
</template>
