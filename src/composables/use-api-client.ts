import { Api, type RequestParams } from "~/lib/api-client";

interface authtoken {
	token: string;
}

function basicSecurityWorker(securityData: authtoken | null): RequestParams | undefined {
	if (securityData) {
		return {
			headers: { authorization: securityData.token },
		};
	}
	return undefined;
}

export function useApiClient() {
	const env = useRuntimeConfig();
	const authStore = useAuth();

	const api = new Api<authtoken>({
		baseApiParams: { secure: true },
		baseUrl: env.public.apiBaseUrl,
		securityWorker: basicSecurityWorker,
	});
	api.setSecurityData({
		token: authStore.authtoken,
	});
	return api;
}
