export default defineNuxtRouteMiddleware(async (to) => {
	const auth = useAuth();
	const localePath = useLocalePath();
	const { locale } = useI18n();
	const loginPath = localePath("/login", locale.value);
	if (!auth.isLoggedIn() && to.path !== loginPath) {
		await navigateTo(loginPath);
	}
});
