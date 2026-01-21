<script setup lang="ts">
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";
import type { QueryResponse } from "~/server/api/query/[id].get.ts";

const localeRoute = useLocaleRoute();

const { data: instancesData } = useGetNoskeinstances(null);
const noskeInstances = computed<Array<PopulatedNoskeDocument>>(() => {
	if (!instancesData.value) return [];
	return Array.isArray(instancesData.value) ? instancesData.value : [instancesData.value];
});

const isSaving = ref(false);
const setSaving = (value: boolean) => {
	isSaving.value = value;
};

async function save(payload: {
	name: string;
	noske: string;
	corpus: string;
	subCorpus: string;
	type: QueryResponse["type"];
	userInput: string;
	facettingValues: unknown;
}) {
	if (isSaving.value) return;
	setSaving(true);
	try {
		const created = await $fetch<QueryResponse>("/api/query", {
			method: "POST",
			body: {
				name: payload.name,
				noske: payload.noske,
				corpus: payload.corpus,
				subCorpus: payload.subCorpus,
				type: payload.type,
				userInput: payload.userInput,
				facettingValues: payload.facettingValues,
			},
		});
		await navigateTo(localeRoute(`/query/${created._id}`));
	} finally {
		setSaving(false);
	}
}

function cancel() {
	navigateTo(localeRoute("/queries"));
}
</script>

<template>
	<MainContent class="mx-auto my-4 flex w-full max-w-2xl flex-col items-center gap-4">
		<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
			<LucideIcon class="size-8 text-foreground" name="Terminal" :stroke-width="2" />
		</div>
		<QueryForm
			:is-saving="isSaving"
			:noske-instances="noskeInstances"
			submit-label="Create"
			@cancel="cancel"
			@submit="save"
		/>
	</MainContent>
</template>
