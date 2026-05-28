import { useQueryClient, type QueryKey } from "@tanstack/vue-query";

export interface NoskeCacheMetadata {
	status: "hit" | "miss" | "refresh" | "skip";
	cacheKey?: string;
	cachedAt?: string;
	fetchedAt?: string;
	noske?: string;
	upstreamDurationMs?: number;
}

const clientQueryKeyHeader = "X-Corpsum-Client-Query-Key";
const refreshModeHeader = "X-Corpsum-Cache-Mode";

export function useNoskeCacheMetadata(queryKey?: MaybeRef<QueryKey | undefined>) {
	const queryClient = useQueryClient();
	const metadataByQueryKey = useState<Record<string, NoskeCacheMetadata>>(
		"noske-cache-metadata",
		() => ({}),
	);
	const refreshingKeys = useState<Array<string>>("noske-cache-refreshing-keys", () => []);
	const serializedQueryKey = computed(() => {
		const resolved = queryKey ? unref(queryKey) : undefined;
		return resolved ? serializeNoskeQueryKey(resolved) : undefined;
	});
	const metadata = computed(() => {
		const key = serializedQueryKey.value;
		return key ? metadataByQueryKey.value[key] : undefined;
	});

	function record(queryKeyValue: QueryKey, response: Response) {
		const next = readNoskeCacheMetadata(response);
		if (!next) return;
		metadataByQueryKey.value = {
			...metadataByQueryKey.value,
			[serializeNoskeQueryKey(queryKeyValue)]: next,
		};
	}

	async function refresh(queryKeyValue: QueryKey = unref(queryKey) ?? []) {
		if (queryKeyValue.length === 0) return;
		const key = serializeNoskeQueryKey(queryKeyValue);
		refreshingKeys.value = [...new Set([...refreshingKeys.value, key])];
		try {
			await queryClient.invalidateQueries({ queryKey: queryKeyValue, exact: true });
		} finally {
			refreshingKeys.value = refreshingKeys.value.filter((entry) => entry !== key);
		}
	}

	return { metadata, metadataByQueryKey, record, refresh };
}

export function createNoskeCacheHeaders(queryKey: QueryKey) {
	const serializedQueryKey = serializeNoskeQueryKey(queryKey);
	const refreshingKeys = useState<Array<string>>("noske-cache-refreshing-keys", () => []);
	const headers: Record<string, string> = {
		[clientQueryKeyHeader]: serializedQueryKey,
	};

	if (refreshingKeys.value.includes(serializedQueryKey)) {
		headers[refreshModeHeader] = "refresh";
	}

	return headers;
}

export function withNoskeCacheHeaders<TClient extends object>(
	client: TClient,
	queryKey: QueryKey,
): TClient {
	return new Proxy(client, {
		get(target, property, receiver) {
			const value = Reflect.get(target, property, receiver) as unknown;
			if (typeof value !== "function") return value;

			return (...args: Array<unknown>) => {
				const lastArg = args.at(-1);
				const hasOptions = lastArg && typeof lastArg === "object" && !Array.isArray(lastArg);
				const options = hasOptions ? { ...(lastArg as Record<string, unknown>) } : {};
				options.headers = mergeHeaders(options.headers, createNoskeCacheHeaders(queryKey));

				const nextArgs = hasOptions ? args.slice(0, -1) : args;
				return value.apply(target, [...nextArgs, options]);
			};
		},
	});
}

export function recordNoskeCacheMetadataFromResponse(request: Request, response: Response) {
	const queryKey = request.headers.get(clientQueryKeyHeader);
	const metadata = readNoskeCacheMetadata(response);
	if (!queryKey || !metadata) return;

	const metadataByQueryKey = useState<Record<string, NoskeCacheMetadata>>(
		"noske-cache-metadata",
		() => ({}),
	);
	metadataByQueryKey.value = {
		...metadataByQueryKey.value,
		[queryKey]: metadata,
	};
}

export function serializeNoskeQueryKey(queryKey: QueryKey) {
	return JSON.stringify(queryKey);
}

function readNoskeCacheMetadata(response: Response): NoskeCacheMetadata | undefined {
	const status = response.headers.get("X-Corpsum-Cache");
	if (status !== "hit" && status !== "miss" && status !== "refresh" && status !== "skip") {
		return undefined;
	}

	const upstreamDurationMs = response.headers.get("X-Corpsum-Upstream-Duration-Ms");
	return {
		status,
		cacheKey: response.headers.get("X-Corpsum-Cache-Key") ?? undefined,
		cachedAt: response.headers.get("X-Corpsum-Cache-Cached-At") ?? undefined,
		fetchedAt: response.headers.get("X-Corpsum-Cache-Fetched-At") ?? undefined,
		noske: response.headers.get("X-Corpsum-Cache-Noske") ?? undefined,
		upstreamDurationMs: upstreamDurationMs ? Number(upstreamDurationMs) : undefined,
	};
}

function mergeHeaders(
	current: unknown,
	additional: Record<string, string>,
): Record<string, string> {
	const headers: Record<string, string> = {};
	if (current instanceof Headers) {
		current.forEach((value, key) => {
			headers[key] = value;
		});
	} else if (Array.isArray(current)) {
		for (const [key, value] of current as Array<[string, string]>) {
			headers[key] = value;
		}
	} else if (current && typeof current === "object") {
		for (const [key, value] of Object.entries(current)) {
			if (typeof value === "string") {
				headers[key] = value;
			}
		}
	}

	return { ...headers, ...additional };
}
