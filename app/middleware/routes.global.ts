import { defaultLocale, isValidLocale } from "@/config/i18n.config";

export default defineNuxtRouteMiddleware(async (to) => {
	const auth = useAuth();
	const routeLocale = to.path.split("/")[1] ?? "";
	const locale = isValidLocale(routeLocale) ? routeLocale : defaultLocale;
	const loginPath = `/${locale}/login`;
	const signupPath = `/${locale}/signup`;
	const imprintPath = `/${locale}/imprint`;
	const isPublishedRoute = to.path.startsWith("/v/") || to.path.startsWith(`/${locale}/v/`);
	const isPublicRoute =
		to.path === loginPath || to.path === signupPath || to.path === imprintPath || isPublishedRoute;

	if (import.meta.server && !isPublicRoute) {
		try {
			const requestFetch = useRequestFetch();
			const session = await requestFetch<RefreshResponse>("/api/auth/refresh");
			auth.setSession(session);
			return;
		} catch {
			return await navigateTo(loginPath, { redirectCode: 302 });
		}
	}

	if (!auth.isLoggedIn() && !isPublicRoute) {
		const isSignupError = to.query.error === "sso" && to.query.mode === "signup";
		const query = to.query.error === "sso" ? { error: "sso" } : undefined;
		return await navigateTo({ path: isSignupError ? signupPath : loginPath, query });
	}
});
