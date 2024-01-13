<script setup lang="ts">
const auth = useAuth();

onMounted(() => {
	console.log("checking auth");
	if (!auth.basicAuthToken) navigateTo("/login");
});
</script>

<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
