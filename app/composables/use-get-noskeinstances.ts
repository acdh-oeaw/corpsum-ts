import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

export function useGetNoskeinstances(id: MaybeRef<string | null>) {
	const resolvedId = computed(() => unref(id));
	const hasId = computed(() => Boolean(resolvedId.value?.length));

	return useAsyncData<Array<PopulatedNoskeDocument> | PopulatedNoskeDocument | null>(
		() => `noskeinstances:${resolvedId.value ?? "all"}`,
		async () => {
			if (hasId.value && resolvedId.value) {
				return await $fetch<PopulatedNoskeDocument>(`/api/noskeinstances/${resolvedId.value}`);
			}
			return await $fetch<Array<PopulatedNoskeDocument>>("/api/noskeinstances");
		},
		{ watch: [resolvedId] },
	);
}
