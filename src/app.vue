<script setup lang="ts">
const auth = useAuth();

onMounted(async () => {
	if (!auth.basicAuthToken) await navigateTo("/login");
});
</script>

<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
