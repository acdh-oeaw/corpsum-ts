import { useQueries } from "@tanstack/vue-query";
import createClient from "openapi-fetch";

import type { components, paths } from "~/lib/noske-types";

type CollxResponse = components["schemas"]["10_collx"];

export interface NoskeCollxQueryDescriptor {
	queryKey: ReadonlyArray<unknown>;
	noske: string;
	enabled: boolean;
	params: {
		corpname: string;
		usesubcorp?: string;
		cattr: string;
		ctow: number;
		cminfreq: number;
		cminbgr: number;
		cbgrfns: string;
		csortfn: "d";
		citemsperpage: number;
		json: string;
	};
}

export function useNoskeCollxQueries(descriptors: Ref<Array<NoskeCollxQueryDescriptor>>) {
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
					const { data, error } = await client.GET("/search/collx", {
						headers: createNoskeCacheHeaders(descriptor.queryKey),
						params: {
							// @ts-expect-error NoSketch accepts the wrapped collx JSON as a serialized query value.
							query: descriptor.params,
						},
					});
					if (error) throw error;
					return data as CollxResponse;
				},
			})),
		),
	});
}
