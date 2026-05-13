import { useQuery, type UseQueryOptions } from "@tanstack/vue-query";
import createClient, { type Client } from "openapi-fetch";

import { useGetNoskeinstances } from "@/composables/use-get-noskeinstances";
import type { paths } from "~/lib/noske-types";
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

type NoskeClient = Client<paths>;
interface NoskeQueryOptions<TData> {
	queryKey: MaybeRef<ReadonlyArray<unknown>>;
	queryFn: (client: NoskeClient) => Promise<TData>;
	enabled?: MaybeRef<boolean>;
	initialData?: TData;
}

export function useNoskeClient(id: MaybeRef<string | null>) {
	const resolvedId = computed(() => unref(id));
	const { data: instanceResponse } = useGetNoskeinstances(resolvedId);
	const instance = computed<PopulatedNoskeDocument | null>(() => {
		if (!resolvedId.value || !instanceResponse.value) return null;
		if (Array.isArray(instanceResponse.value)) {
			return instanceResponse.value.find(({ _id }) => _id === resolvedId.value) ?? null;
		}
		return instanceResponse.value;
	});

	const client = computed<NoskeClient | null>(() => {
		if (!instance.value) return null;
		if (resolvedId.value && instance.value._id !== resolvedId.value) return null;
		return createClient<paths>({
			baseUrl: `/api/noske/${instance.value._id}`,
		});
	});

	const useNoskeQuery = <TData>(options: NoskeQueryOptions<TData>) => {
		const baseOptions: UseQueryOptions<TData, Error, TData, TData> = {
			queryKey: computed(() => unref(options.queryKey)),
			enabled: computed(() => Boolean(client.value) && (unref(options.enabled) ?? true)),
			async queryFn() {
				const activeClient = client.value;
				if (!activeClient) {
					throw new Error("NoSketch client is not ready yet.");
				}
				return options.queryFn(activeClient);
			},
		};

		const finalOptions = {
			...baseOptions,
		} as UseQueryOptions<TData, Error, TData, TData> & {
			initialData?: TData;
			staleTime?: number;
		};

		if (options.initialData !== undefined) {
			finalOptions.initialData = options.initialData;
			finalOptions.staleTime = 0;
		}

		return useQuery<TData, Error, TData>(finalOptions);
	};

	return { client, instance, useNoskeQuery };
}
