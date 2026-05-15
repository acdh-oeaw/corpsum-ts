<script lang="ts" setup>
import { defaultLocale, isValidLocale } from "@/config/i18n.config";
import { cn } from "@/utils/shadcn";

definePageMeta({
	title: "LoginPage.meta.title",
	layout: "full-page",
});

const t = useTranslations();

const route = useRoute();

const auth = useAuth();
const username = ref("");
const password = ref("");
const isLoading = ref(false);
const statusMessage = ref(route.query.error === "sso" ? t("LoginPage.errors.sso") : "");
const pageLocale = computed(() => {
	const locale = route.path.split("/")[1] ?? "";
	return isValidLocale(locale) ? locale : defaultLocale;
});
const homePath = computed(() => `/${pageLocale.value}`);
const signupPath = computed(() => `/${pageLocale.value}/signup`);
const githubLoginUrl = computed(() => {
	const params = new URLSearchParams({
		redirect: homePath.value,
		errorRedirect: `/${pageLocale.value}/login`,
	});
	return `/api/auth/sso/github?${params.toString()}`;
});

async function submitAuth() {
	isLoading.value = true;
	statusMessage.value = "";

	const success = await auth.login(username.value, password.value);

	if (!success) {
		isLoading.value = false;
		statusMessage.value = t("WrongCredentials");
		return;
	}
	return await navigateTo(homePath.value);
}

onBeforeMount(async () => {
	if (route.query.mode === "signup") {
		const query = route.query.error === "sso" ? { error: "sso" } : undefined;
		await navigateTo({ path: signupPath.value, query });
		return;
	}
	if (auth.isLoggedIn()) await navigateTo(homePath.value);
});
</script>

<template>
	<MainContent
		class="relative hidden h-screen w-full min-w-0 flex-col items-center justify-center md:grid lg:grid-cols-2 lg:px-0"
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
				<form class="my-auto" @submit.prevent="submitAuth">
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
						<p v-if="statusMessage" class="text-sm text-destructive" role="alert">
							{{ statusMessage }}
						</p>
						<Button :disabled="isLoading" type="submit" variant="outline">
							{{ t("login") }}
						</Button>
						<div class="flex items-center justify-center gap-1 text-sm text-muted-foreground">
							<span>{{ t("LoginPage.prompts.noAccount") }}</span>
							<Button as-child class="px-1" type="button" variant="link">
								<NuxtLink :to="signupPath">
									{{ t("LoginPage.actions.createAccount") }}
								</NuxtLink>
							</Button>
						</div>
						<div class="flex items-center gap-3 py-2 text-xs text-muted-foreground">
							<div class="h-px flex-1 bg-border" />
							<span>{{ t("LoginPage.or") }}</span>
							<div class="h-px flex-1 bg-border" />
						</div>
						<Button as-child :disabled="isLoading" variant="outline">
							<a :href="githubLoginUrl">
								<Icon class="mr-1 size-4" name="simple-icons:github" />
								{{ t("LoginPage.actions.continueWithGithub") }}
							</a>
						</Button>
					</div>
				</form>
			</div>
		</div>
	</MainContent>
</template>
