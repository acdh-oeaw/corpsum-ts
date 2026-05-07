<script setup lang="ts">
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

const t = useTranslations();
const route = useRoute();
const localeRoute = useLocaleRoute();
const auth = useAuth();

const noskeId = computed(() => {
	const idParam = route.params.id;
	const resolved = Array.isArray(idParam) ? idParam[0] : idParam;
	return typeof resolved === "string" ? resolved : null;
});

const fetcher = $fetch as (input: string) => Promise<PopulatedNoskeDocument>;
const { data: noskeInstance } = await useAsyncData<PopulatedNoskeDocument | null>(
	() => (noskeId.value ? fetcher(`/api/noskeinstances/${noskeId.value}`) : Promise.resolve(null)),
	{
		watch: [noskeId],
		default: () => null,
	},
);

const isSaving = ref(false);

const isOwner = computed(() => noskeInstance.value?.owner.username === auth.username);

const initialValues = computed(() =>
	noskeInstance.value
		? {
				name: noskeInstance.value.name,
				base: noskeInstance.value.base,
				host: noskeInstance.value.host,
				public: noskeInstance.value.public,
				version: noskeInstance.value.version,
				authentication: noskeInstance.value.authentication,
			}
		: null,
);
const formId = "noske-form";

async function save(payload: {
	name: string;
	base: string;
	host: string;
	public: boolean;
	version: PopulatedNoskeDocument["version"];
	authentication: PopulatedNoskeDocument["authentication"];
}) {
	if (!isOwner.value || !noskeId.value) return;
	isSaving.value = true;
	try {
		const updated = await $fetch<PopulatedNoskeDocument>(`/api/noskeinstances/${noskeId.value}`, {
			method: "PATCH",
			body: payload,
		});
		noskeInstance.value = updated;
		await navigateTo(localeRoute(`/noskeinstance/${updated._id}`));
	} finally {
		isSaving.value = false;
	}
}

function cancel() {
	if (!noskeId.value) return;
	navigateTo(localeRoute(`/noskeinstance/${noskeId.value}`));
}
</script>

<template>
	<MainContent v-if="noskeInstance" class="my-4 flex w-full min-w-0 flex-col gap-4">
		<div class="my-10 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
					<LucideIcon class="size-8 text-foreground" name="Database" :stroke-width="2" />
				</div>
				<PageTitle>{{ noskeInstance.name }}</PageTitle>
			</div>
			<div class="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
				<Button
					v-if="isOwner"
					:disabled="isSaving"
					:form="formId"
					size="sm"
					type="submit"
					variant="ghost"
				>
					<LucideIcon class="mr-1 size-4" name="Save" :stroke-width="2" />
					{{ t("Actions.save") }}
				</Button>
				<Button size="sm" type="button" variant="ghost" @click="cancel">
					<LucideIcon class="mr-1 size-4" name="X" :stroke-width="2" />
					{{ t("Actions.cancel") }}
				</Button>
			</div>
		</div>
		<p v-if="!isOwner" class="text-sm text-muted-foreground">
			{{ t("Permissions.instanceEditDisabled") }}
		</p>
		<div class="w-full">
			<NoskeForm
				:form-id="formId"
				:initial-values="initialValues ?? undefined"
				:is-saving="isSaving || !isOwner"
				reset-label="Reset"
				:show-actions="false"
				:show-reset="isOwner"
				:submit-label="t('Actions.save')"
				@cancel="cancel"
				@submit="save"
			/>
		</div>
	</MainContent>
</template>
