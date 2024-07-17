import { useApiClient } from "@/composables/use-api-client.ts";

export function useCreateSubcorpus(
	corpname: string,
	subcname: string,
	q?: string,
	json?: Record<string, never>,
) {
	const api = useApiClient();
	return api.search.getSubCorp({
		corpname,
		subcname,
		create: 1,
		q,
		json,
	});
}
