import { useQueries } from "@tanstack/vue-query";
import createClient from "openapi-fetch";

import type { components, paths } from "~/lib/noske-types";

type CorpusInfoResponse = components["schemas"]["01_corp_info"];

export interface NoskeCorpusInfoQueryDescriptor {
	queryKey: ReadonlyArray<unknown>;
	noske: string;
	corpus: string;
}

export function useNoskeCorpusInfoQueries(descriptors: Ref<Array<NoskeCorpusInfoQueryDescriptor>>) {
	return useQueries({
		queries: computed(() =>
			descriptors.value.map((descriptor) => ({
				queryKey: descriptor.queryKey,
				enabled: Boolean(descriptor.noske && descriptor.corpus),
				async queryFn() {
					const client = createClient<paths>({
						baseUrl: `/api/noske/${descriptor.noske}`,
					});
					const { data, error } = await client.GET("/search/corp_info", {
						params: { query: { corpname: descriptor.corpus } },
					});
					if (error) throw error;
					return data as CorpusInfoResponse;
				},
			})),
		),
	});
}
