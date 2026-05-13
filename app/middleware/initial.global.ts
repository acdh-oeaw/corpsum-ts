let hasRun = false;
// This middleware runs only once on the initial page load to check if the auth token is valid
export default defineNuxtRouteMiddleware(async () => {
	if (import.meta.server) {
		return;
	}

	if (!hasRun) {
		hasRun = true;
		const auth = useAuth();
		if (!(await auth.refresh())) {
			console.warn("token invalid, logging out");
			await auth.logout();
		}
	}
});
