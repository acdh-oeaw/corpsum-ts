/* eslint-disable import-x/no-duplicates */
import type { Middleware } from "openapi-fetch";
import createClient from "openapi-fetch";

import type { paths } from "@/types/corpsum.schema";

const myMiddleware: Middleware = {
	async onRequest({ request }) {
		const authStore = useAuth();
		const { expiry } = storeToRefs(authStore);
		// refresh token if it expires in less than 2 minutes
		if (expiry.value - Date.now() < 120000) {
			await authStore.refresh();
		}
		return request;
	},
	onError({ error }) {
		return new Error("Oops, fetch failed", { cause: error });
	},
};

export function useCorpsumClient() {
	const { appBaseUrl } = useRuntimeConfig();
	const client = createClient<paths>({ baseUrl: appBaseUrl as string });
	client.use(myMiddleware);
	return client;
}
