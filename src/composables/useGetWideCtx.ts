import { useQuery } from "@tanstack/vue-query";

interface params {
	corpname: string,
	pos: number,
	tokencount: number,
}

export function useGetWideCtx(
	params: MaybeRef<params>,
	options?: { enabled?: boolean },
) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-wide-ctx", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const response = await api.search.getFullRef(
				{
					corpname: params.corpname,
					pos: params.pos,
					// detail_left_ctx: params.tokencount,
					// detail_right_ctx: params.tokencount,
				}
			);
			return response;
		},
	});
}
