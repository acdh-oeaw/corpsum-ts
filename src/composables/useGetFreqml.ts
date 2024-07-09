import { useQueryStore } from "@tanstack/vue-query";

interface params {
	corpname: string,
	ml1attr: string,
  ml1ctx: string,
	q?: string,
	usesubcorp?: string,
	fpage?: number,
	freq_sort?: "frq" | "rel",
	group?: 0 | 1,
	showpoc?: 0 | 1,
	showreltt?: 0 | 1,
	showrel?: 0 | 1,
	freqlevel?: 1 | 2 | 3 | 4 | 5 | 6,
	json?: Record<string, unknown>,
}

export function useGetFreqml(
	params: MaybeRef<params>,
	options?: { enabled?: boolean },
) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-freqml", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const response = await api.search.getFreqMl({
                ...params
            })
            return response;
		},
	});
}
