<script setup lang="ts">
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

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
	<MainContent
		v-if="noskeInstance"
		class="mx-auto my-4 flex w-full max-w-2xl flex-col items-center gap-4"
	>
		<p v-if="!isOwner" class="text-center text-sm text-muted-foreground">
			You do not own this instance. Editing is disabled.
		</p>
		<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
			<LucideIcon class="size-8 text-foreground" name="Database" :stroke-width="2" />
		</div>
		<div class="w-full">
			<NoskeForm
				:initial-values="initialValues ?? undefined"
				:is-saving="isSaving || !isOwner"
				reset-label="Reset"
				:show-reset="isOwner"
				submit-label="Save"
				@cancel="cancel"
				@submit="save"
			/>
		</div>
	</MainContent>
</template>
