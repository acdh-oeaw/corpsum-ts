import { useQueries } from "@tanstack/vue-query";
import createClient from "openapi-fetch";

import type { components, paths } from "~/lib/noske-types";

type ConcordanceResponse = components["schemas"]["06_concordance"];

export interface NoskeConcordanceQueryDescriptor {
	queryKey: ReadonlyArray<unknown>;
	noske: string;
	enabled: boolean;
	params: {
		corpname: string;
		usesubcorp?: string;
		viewmode: "kwic";
		attrs: string;
		structs: string;
		refs: string;
		pagesize: number;
		json: string;
		format: "json";
	};
}

export function useNoskeConcordanceQueries(
	descriptors: Ref<Array<NoskeConcordanceQueryDescriptor>>,
) {
	return useQueries({
		queries: computed(() =>
			descriptors.value.map((descriptor) => ({
				queryKey: descriptor.queryKey,
				enabled: descriptor.enabled && Boolean(descriptor.noske),
				async queryFn() {
					const client = createClient<paths>({
						baseUrl: `/api/noske/${descriptor.noske}`,
					});
					client.use({
						onResponse({ request, response }) {
							recordNoskeCacheMetadataFromResponse(request, response);
						},
					});
					const { data, error } = await client.GET("/search/concordance", {
						headers: createNoskeCacheHeaders(descriptor.queryKey),
						params: {
							query: descriptor.params,
						},
					});
					if (error) throw error;
					return data as ConcordanceResponse;
				},
			})),
		),
	});
}
