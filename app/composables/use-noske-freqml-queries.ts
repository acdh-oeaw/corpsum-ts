import { useQueries } from "@tanstack/vue-query";
import createClient from "openapi-fetch";

import type { paths } from "~/lib/noske-types";
import type { components } from "~/lib/noske-types";

type FreqMlResponse = components["schemas"]["11_freqml"];

export interface NoskeFreqMlQueryDescriptor {
	queryKey: ReadonlyArray<unknown>;
	noske: string;
	enabled: boolean;
	params: {
		corpname: string;
		usesubcorp?: string;
		fmaxitems?: number;
		fpage?: number;
		group?: 0 | 1;
		showpoc?: 0 | 1;
		showreltt?: 0 | 1;
		showrel?: 0 | 1;
		freqlevel?: 1 | 2 | 3 | 4 | 5 | 6;
		ml1attr: string;
		ml1ctx: string;
		json: string;
	};
}

export function useNoskeFreqMlQueries(descriptors: Ref<Array<NoskeFreqMlQueryDescriptor>>) {
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
					const { data, error } = await client.GET("/search/freqml", {
						headers: createNoskeCacheHeaders(descriptor.queryKey),
						params: {
							query: descriptor.params,
						},
					});
					if (error) throw error;
					return data as FreqMlResponse;
				},
			})),
		),
	});
}
