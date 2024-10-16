export default defineNuxtRouteMiddleware(async (to) => {
	const nuxt = useNuxtApp();
	const auth = useAuth();
	const localeRoute = useLocaleRoute();
	const i18n = nuxt.$i18n;
	const loginPath = localeRoute("/login", i18n.locale.value);
	if (!auth.isLoggedIn() && to.path.toString() !== loginPath?.path.toString()) {
		await navigateTo(localeRoute("/login", i18n.locale.value));
	}
});
