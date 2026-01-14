import type { components } from "~/lib/noske-types";

interface WideCtxParams {
	corpname: string;
	pos: number;
	tokencount: number;
	noske?: string | null;
}

type FullRefResponse = components["schemas"]["14_fullref"];

export function useGetWideCtx(params: MaybeRef<WideCtxParams>, options?: { enabled?: boolean }) {
	const resolved = computed(() => unref(params));
	const noskeId = computed(() => resolved.value.noske ?? null);
	const { useNoskeQuery } = useNoskeClient(noskeId);

	return useNoskeQuery<FullRefResponse>({
		queryKey: computed(() => ["get-wide-ctx", resolved.value.corpname, resolved.value.pos]),
		enabled: computed(
			() =>
				Boolean(resolved.value.corpname) && Boolean(noskeId.value) && (options?.enabled ?? true),
		),
		async queryFn(client) {
			const { data } = await client.GET("/search/fullref", {
				params: {
					query: {
						corpname: resolved.value.corpname,
						pos: resolved.value.pos,
					},
				},
			});
			if (!data) {
				throw new Error("No full reference data returned.");
			}
			return data;
		},
	});
}
