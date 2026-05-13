<script setup lang="ts">
import { defaultLocale, isValidLocale } from "@/config/i18n.config";

const auth = useAuth();
const route = useRoute();

onMounted(async () => {
	const routeLocale = route.path.split("/")[1] ?? "";
	const locale = isValidLocale(routeLocale) ? routeLocale : defaultLocale;
	const loginPath = `/${locale}/login`;
	const signupPath = `/${locale}/signup`;
	if (!auth.username && route.path !== loginPath && route.path !== signupPath) {
		return navigateTo(loginPath);
	}
	return null;
});
</script>

<template>
	<NuxtLayout>
		<NuxtPage />
		<NuxtLoadingIndicator />
		<TailwindIndicator />
		<NuxtRouteAnnouncer />
	</NuxtLayout>
</template>
