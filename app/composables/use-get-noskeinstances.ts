import { useQuery } from "@tanstack/vue-query";

export function useGetNoskeinstances(id: MaybeRef<string | null>) {
	return useQuery({
		queryKey: ["noskeinstances", id] as const,
		async queryFn({ queryKey }) {
			const [, id] = queryKey;
			if (id !== null) return useFetch(`/api/noskeinstances/${id}`, {});
			return useFetch(`/api/noskeinstances/`, {});
		},
	});
}
