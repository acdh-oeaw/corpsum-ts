<script setup lang="ts">
const auth = useAuth();

onMounted(async () => {
	console.log("checking auth");
	if (!auth.basicAuthToken) await navigateTo("/login");
});
</script>

<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
