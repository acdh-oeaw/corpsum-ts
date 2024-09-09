<script lang="ts" setup>
const t = useTranslations("LoginPage");
definePageMeta({
	title: "LoginPage.meta.title",
});

const localeRoute = useLocaleRoute();
const { locale } = useI18n();

const auth = useAuth();
const username = ref("");
const password = ref("");

async function login() {
	if (!(await auth.login(username.value, password.value))) return alert(t("WrongCredentials"));
	return await navigateTo(localeRoute("/", locale.value));
}

onMounted(async () => {
	if (auth.isLoggedIn()) await navigateTo(localeRoute("/", locale.value));
});
</script>

<template>
	<MainContent class="container py-8">
		<VForm @submit.prevent="login">
			<VContainer class="flex justify-center">
				<div class="flex w-full flex-col sm:w-1/2">
					<h1>Please Login</h1>
					<VTextField v-model="username" :label="t('username')"></VTextField>
					<VTextField v-model="password" :label="t('password')" type="password"></VTextField>
					<VBtn block type="submit">{{ t("login") }}</VBtn>
				</div>
			</VContainer>
		</VForm>
	</MainContent>
</template>
