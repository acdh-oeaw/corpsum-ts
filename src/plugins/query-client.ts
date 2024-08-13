import {
	dehydrate,
	type DehydratedState,
	hydrate,
	keepPreviousData,
	QueryCache,
	QueryClient,
	VueQueryPlugin,
	type VueQueryPluginOptions,
} from "@tanstack/vue-query";

export default defineNuxtPlugin((nuxt) => {
	const state = useState<DehydratedState | null>("vue-query");
	const toastsStore = useToastsStore();
	const { addToast } = toastsStore;

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				placeholderData: keepPreviousData,
				staleTime: 1000 * 60 * 15,
			},
		},
		queryCache: new QueryCache({
			onError(error) {
				// FIXME:
				const message =
					error instanceof Response
						? // @ts-expect-error Set by api client.
							// eslint-disable-next-line
							((error.error?.title as string | undefined) ?? error.statusText)
						: error.message;

				if (process.client) {
					addToast({
						title: "Error",
						description: message,
						type: "foreground",
						variant: "negative",
					});
				} else {
					console.error(error);
				}
			},
		}),
	});

	const options: VueQueryPluginOptions = { queryClient };

	nuxt.vueApp.use(VueQueryPlugin, options);

	if (process.server) {
		nuxt.hooks.hook("app:rendered", () => {
			state.value = dehydrate(queryClient);
		});
	}

	if (process.client) {
		nuxt.hooks.hook("app:created", () => {
			hydrate(queryClient, state.value);
		});
	}
});
