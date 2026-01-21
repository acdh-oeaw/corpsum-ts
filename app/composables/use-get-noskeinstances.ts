import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

export function useGetNoskeinstances(id: MaybeRef<string | null>) {
	const resolvedId = computed(() => unref(id));
	const hasId = computed(() => Boolean(resolvedId.value?.length));
	const requestFetch = useRequestFetch();

	return useAsyncData<Array<PopulatedNoskeDocument> | PopulatedNoskeDocument | null>(
		() => `noskeinstances:${resolvedId.value ?? "all"}`,
		async () => {
			const fetcher = import.meta.server ? requestFetch : $fetch;
			if (hasId.value && resolvedId.value) {
				return fetcher<PopulatedNoskeDocument>(`/api/noskeinstances/${resolvedId.value}`);
			}
			return fetcher<Array<PopulatedNoskeDocument>>("/api/noskeinstances");
		},
		{ watch: [resolvedId] },
	);
}
