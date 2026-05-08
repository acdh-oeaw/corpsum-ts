<script setup lang="ts">
const auth = useAuth();
const route = useRoute();
const localePath = useLocalePath();
const { locale } = useI18n();

onMounted(async () => {
	const loginPath = localePath("/login", locale.value);
	if (!auth.username && route.path !== loginPath) {
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
