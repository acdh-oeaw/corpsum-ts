import { Api, type RequestParams } from "~/lib/api-client";

interface userPass {
	user: string;
	pass: string;
}

let api = new Api<userPass>();

function basicSecurityWorker(securityData: userPass | null): RequestParams | undefined {
	if (securityData) {
		return {
			headers: { authorization: "Basic " + btoa(securityData.user + ":" + securityData.pass) },
		};
	}
	return undefined;
}

export function useApiClient() {
	const env = useRuntimeConfig();

	if (env.public.apiUser) {
		api = new Api<userPass>({
			baseApiParams: { secure: true },
			securityWorker: basicSecurityWorker,
		});
		api.setSecurityData({
			user: env.public.apiUser,
			pass: env.public.apiPass,
		});
	}

	if (env.public.apiBaseUrl) {
		api.baseUrl = env.public.apiBaseUrl;
	}

	return api;
}
