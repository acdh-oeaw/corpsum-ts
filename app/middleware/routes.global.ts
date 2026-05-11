import { defaultLocale, isValidLocale } from "@/config/i18n.config";

export default defineNuxtRouteMiddleware(async (to) => {
	if (import.meta.server) {
		return;
	}

	const auth = useAuth();
	const localePath = useLocalePath();
	const routeLocale = to.path.split("/")[1] ?? "";
	const locale = isValidLocale(routeLocale) ? routeLocale : defaultLocale;
	const loginPath = localePath("/login", locale);

	if (!auth.isLoggedIn() && to.path !== loginPath) {
		return await navigateTo(loginPath);
	}
});
