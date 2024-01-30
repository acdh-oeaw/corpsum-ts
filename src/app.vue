<script setup lang="ts">
const auth = useAuth();
const route = useRoute()

onMounted(async () => {
	if (!auth.username && (route.path === "/en" || route.path === "/de")) return navigateTo("/en/login");
});
</script>

<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
