<script lang="ts" setup>
definePageMeta({
	title: "Login",
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
		<v-form @submit.prevent="login">
			<v-container class="flex justify-center">
				<div class="flex w-full flex-col sm:w-1/2">
					<h1>Please Login</h1>
					<v-text-field v-model="username" placeholder="username"></v-text-field>
					<v-text-field v-model="password" type="password" placeholder="password"></v-text-field>
					<v-btn type="submit" block>Login</v-btn>
				</div>
			</v-container>
		</v-form>
	</MainContent>
</template>
