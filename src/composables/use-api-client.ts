import { Api } from "~/lib/api-client";

export function useApiClient() {
	const api = new Api({
		baseApiParams: { secure: true },
		baseUrl: `/api/noske/amc`,
	});
	return api;
}
