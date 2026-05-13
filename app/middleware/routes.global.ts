import { defaultLocale, isValidLocale } from "@/config/i18n.config";

export default defineNuxtRouteMiddleware(async (to) => {
	if (import.meta.server) {
		return;
	}

	const auth = useAuth();
	const routeLocale = to.path.split("/")[1] ?? "";
	const locale = isValidLocale(routeLocale) ? routeLocale : defaultLocale;
	const loginPath = `/${locale}/login`;

	if (!auth.isLoggedIn() && to.path !== loginPath) {
		const query =
			to.query.error === "sso"
				? { error: "sso", ...(to.query.mode === "signup" ? { mode: "signup" } : {}) }
				: undefined;
		return await navigateTo({ path: loginPath, query });
	}
});
