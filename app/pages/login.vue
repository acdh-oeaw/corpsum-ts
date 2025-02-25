<script lang="ts" setup>
import { cn } from "@/utils/shadcn";

definePageMeta({
	title: "LoginPage.meta.title",
	layout: "full-page",
});

const t = useTranslations("LoginPage");

const localeRoute = useLocaleRoute();
const { locale } = useI18n();

const auth = useAuth();
const username = ref("");
const password = ref("");
const isLoading = ref(false);

async function login() {
	isLoading.value = true;
	if (!(await auth.login(username.value, password.value))) {
		isLoading.value = false;
		return alert(t("WrongCredentials"));
	}
	return await navigateTo(localeRoute("/", locale.value));
}

onBeforeMount(async () => {
	if (auth.isLoggedIn()) await navigateTo(localeRoute("/", locale.value));
});
</script>

<template>
	<MainContent
		class="container relative hidden h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0"
	>
		<div class="relative h-full flex-col p-10 text-white dark:border-r lg:flex">
			<div class="absolute inset-0 bg-zinc-900" />
			<div class="relative text-7xl font-bold">CorpSum</div>
			<div class="relative mt-auto">
				<p class="text-lg">
					{{ t("splashtext") }}
				</p>
			</div>
		</div>
		<div class="h-full lg:p-4">
			<div class="flex justify-end">
				<LocaleSwitcher />
				<ColorSchemeSwitcher />
			</div>
			<div :class="cn('mx-auto grid h-full max-w-96 gap-6', $attrs.class ?? '')">
				<form class="my-auto">
					<div class="grid gap-2">
						<div class="grid gap-1">
							<Input
								id="username"
								v-model="username"
								:disabled="isLoading"
								:placeholder="t('username')"
								type="text"
							/>
							<Input
								id="password"
								v-model="password"
								:disabled="isLoading"
								:placeholder="t('password')"
								type="password"
							/>
						</div>
						<Button :disabled="isLoading" type="submit" variant="outline" @click="login">
							{{ t("login") }}
						</Button>
					</div>
				</form>
			</div>
		</div>
	</MainContent>
</template>
