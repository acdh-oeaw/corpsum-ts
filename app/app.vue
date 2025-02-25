<script setup lang="ts">
const nuxt = useNuxtApp();
const auth = useAuth();
const route = useRoute();
const localeRoute = useLocaleRoute();
const i18n = nuxt.$i18n;

onMounted(async () => {
	const loginPath = localeRoute("/login", i18n.locale.value);
	if (!auth.username && route.path !== loginPath?.fullPath)
		return navigateTo(localeRoute("/login", i18n.locale.value));
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
