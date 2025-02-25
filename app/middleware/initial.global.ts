let hasRun = false;

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
