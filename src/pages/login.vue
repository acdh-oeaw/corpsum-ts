<script lang="ts" setup>
definePageMeta({
	title: "LoginPage.meta.title",
});

const auth = useAuth();
const username = ref("");
const password = ref("");

function login() {
	if (!auth.login(username.value, password.value)) return alert("Username or Password wrong");
}
</script>

<template>
	<MainContent class="container py-8">
		<VForm @submit.prevent="login">
			<VContainer class="flex justify-center">
				<div class="flex w-full flex-col sm:w-1/2">
					<h1>Please Login</h1>
					<VTextField v-model="username" placeholder="username"></VTextField>
					<VTextField v-model="password" type="password" placeholder="password"></VTextField>
					<VBtn type="submit" block>Login</VBtn>
				</div>
			</VContainer>
		</VForm>
	</MainContent>
</template>
