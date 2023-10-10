<script setup lang="ts">
const authStore = useAuth();
authStore.$subscribe(async (_mutation, _state) => {
	if (authStore.username) return await navigateTo("/corpsum");
	await navigateTo("/login");
});
</script>

<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
