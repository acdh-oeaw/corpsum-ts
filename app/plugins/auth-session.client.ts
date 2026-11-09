import { defaultLocale, isValidLocale } from "@/config/i18n.config";

export default defineNuxtPlugin((nuxtApp) => {
	const auth = useAuth();
	const router = useRouter();
	let timer: ReturnType<typeof setTimeout> | undefined;

	function expireSession() {
		auth.setUser(null);
		const path = router.currentRoute.value.path;
		const segment = path.split("/")[1] ?? "";
		const locale = isValidLocale(segment) ? segment : defaultLocale;
		if (
			path === `/${locale}/login` ||
			path === `/${locale}/signup` ||
			path === `/${locale}/imprint` ||
			path.startsWith("/v/") ||
			path.startsWith(`/${locale}/v/`)
		)
			return;
		void nuxtApp.runWithContext(() => navigateTo(`/${locale}/login`));
	}

	function checkExpiry() {
		if (auth.user && auth.expires !== null && auth.expires <= Date.now()) expireSession();
	}

	function scheduleExpiry(expires: number) {
		const delay = Math.min(Math.max(expires - Date.now(), 0), 2_147_483_647);
		timer = setTimeout(() => {
			checkExpiry();
			if (auth.expires !== null && auth.expires > Date.now()) scheduleExpiry(auth.expires);
		}, delay);
	}

	watch(
		() => auth.expires,
		(expires) => {
			if (timer) clearTimeout(timer);
			if (expires === null) return;
			scheduleExpiry(expires);
		},
		{ immediate: true },
	);
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible") checkExpiry();
	});

	globalThis.$fetch = globalThis.$fetch.create({
		onResponseError({ response }) {
			if (
				response.status === 401 &&
				response._data?.statusMessage === "Session expired or invalid"
			) {
				expireSession();
			}
		},
	});
});
