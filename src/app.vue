<script setup lang="ts">
const authStore = useAuth();
authStore.$subscribe((_mutation, _state): void => {
	if (authStore.username) return void navigateTo("/corpsum");
	void navigateTo("/login");
});
</script>

<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
