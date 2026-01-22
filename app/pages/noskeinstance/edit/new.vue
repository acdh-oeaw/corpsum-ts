<script setup lang="ts">
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

const t = useTranslations();
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

const formId = "noske-form";
</script>

<template>
	<MainContent class="mx-auto my-4 flex w-full max-w-5xl flex-col gap-4">
		<div class="my-10 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
					<LucideIcon class="size-8 text-foreground" name="Database" :stroke-width="2" />
				</div>
				<PageTitle>{{ t("Actions.newInstance") }}</PageTitle>
			</div>
			<div class="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
				<Button :disabled="isSaving" :form="formId" size="sm" type="submit" variant="ghost">
					<LucideIcon class="mr-1 size-4" name="Save" :stroke-width="2" />
					{{ t("Actions.create") }}
				</Button>
				<Button :disabled="isSaving" size="sm" type="button" variant="ghost" @click="cancel">
					<LucideIcon class="mr-1 size-4" name="X" :stroke-width="2" />
					{{ t("Actions.cancel") }}
				</Button>
			</div>
		</div>
		<div class="w-full">
			<NoskeForm
				:form-id="formId"
				:is-saving="isSaving"
				:show-actions="false"
				:submit-label="t('Actions.create')"
				@cancel="cancel"
				@submit="save"
			/>
		</div>
	</MainContent>
</template>
