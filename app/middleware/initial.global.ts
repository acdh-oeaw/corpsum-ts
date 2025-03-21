let hasRun = false;
// This middleware runs only once on the initial page load to check if the auth token is valid
export default defineNuxtRouteMiddleware(async () => {
	if (!hasRun) {
		hasRun = true;
		const auth = useAuth();
		const res = await fetch("/api/auth/me", {
			method: "GET",
		});
		if (!res.ok) {
			console.log("token invalid, logging out");
			await auth.logout();
		}
	}
});
