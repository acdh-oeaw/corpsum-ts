export function useAuthenticatedFetch() {
	const authenticatedFetch = (URL: string, options = {}, headers = {}) => {
		const auth = useAuth();

		return useFetch(URL, {
			headers: {
				Authorization: `Basic ${auth.basicAuthToken}`,
				...headers,
			},

			...options,
		});
	};

	return { authenticatedFetch };
}
