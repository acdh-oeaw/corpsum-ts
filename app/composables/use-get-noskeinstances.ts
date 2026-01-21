import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

export function useGetNoskeinstances(id: MaybeRef<string | null>) {
	const resolvedId = computed(() => unref(id));
	const hasId = computed(() => Boolean(resolvedId.value?.length));

	return useAsyncData<Array<PopulatedNoskeDocument> | PopulatedNoskeDocument | null>(
		() => `noskeinstances:${resolvedId.value ?? "all"}`,
		async () => {
			if (import.meta.server) {
				const requestFetch = useRequestFetch() as typeof $fetch;
				if (hasId.value && resolvedId.value) {
					return requestFetch<PopulatedNoskeDocument>(`/api/noskeinstances/${resolvedId.value}`);
				}
				return requestFetch<Array<PopulatedNoskeDocument>>("/api/noskeinstances");
			}
			if (hasId.value && resolvedId.value) {
				return $fetch<PopulatedNoskeDocument>(`/api/noskeinstances/${resolvedId.value}`);
			}
			return $fetch<Array<PopulatedNoskeDocument>>("/api/noskeinstances");
		},
		{ watch: [resolvedId] },
	);
}
