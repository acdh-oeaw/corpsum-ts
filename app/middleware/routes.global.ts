import { defaultLocale, isValidLocale } from "@/config/i18n.config";

export default defineNuxtRouteMiddleware(async (to) => {
	if (import.meta.server) {
		return;
	}

	const auth = useAuth();
	const routeLocale = to.path.split("/")[1] ?? "";
	const locale = isValidLocale(routeLocale) ? routeLocale : defaultLocale;
	const loginPath = `/${locale}/login`;
	const signupPath = `/${locale}/signup`;

	if (!auth.isLoggedIn() && to.path !== loginPath && to.path !== signupPath) {
		const isSignupError = to.query.error === "sso" && to.query.mode === "signup";
		const query = to.query.error === "sso" ? { error: "sso" } : undefined;
		return await navigateTo({ path: isSignupError ? signupPath : loginPath, query });
	}
});
