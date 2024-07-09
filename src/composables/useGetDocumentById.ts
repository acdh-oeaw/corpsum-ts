import { useQueryStore } from "@tanstack/vue-query";

interface params {
	corpusId: number,
	documentId: number,
}

export function useGetDocumentById(
	params: MaybeRef<params>,
	options?: { enabled?: boolean },
) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-document-by-id", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const response = await api.ca.getDocumentOriginal(
				params.corpusId,
				params.documentId,
			);
			return response;
		},
	});
}
