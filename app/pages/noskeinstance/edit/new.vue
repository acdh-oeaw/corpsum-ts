<script setup lang="ts">
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

const localeRoute = useLocaleRoute();

const isSaving = ref(false);
const setSaving = (value: boolean) => {
	isSaving.value = value;
};

async function save(payload: {
	name: string;
	base: string;
	host: string;
	public: boolean;
	version: PopulatedNoskeDocument["version"];
	authentication: PopulatedNoskeDocument["authentication"];
}) {
	if (isSaving.value) return;
	setSaving(true);
	try {
		const created = await $fetch<PopulatedNoskeDocument>("/api/noskeinstances", {
			method: "POST",
			body: {
				name: payload.name,
				base: payload.base,
				host: payload.host,
				public: payload.public,
				version: payload.version,
				authentication: payload.authentication,
			},
		});
		await navigateTo(localeRoute(`/noskeinstance/${created._id}`));
	} finally {
		setSaving(false);
	}
}

function cancel() {
	navigateTo(localeRoute("/noskeinstances"));
}
</script>

<template>
	<MainContent class="mx-auto my-4 flex w-full max-w-2xl flex-col items-center gap-4">
		<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
			<LucideIcon class="size-8 text-foreground" name="Database" :stroke-width="2" />
		</div>
		<div class="w-full">
			<NoskeForm :is-saving="isSaving" submit-label="Create" @cancel="cancel" @submit="save" />
		</div>
	</MainContent>
</template>
