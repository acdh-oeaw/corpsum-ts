<script lang="ts" setup>
import { cn } from "@/utils/shadcn";

definePageMeta({
	title: "LoginPage.meta.title",
	layout: "full-page",
});

const t = useTranslations();

const localeRoute = useLocaleRoute();
const localePath = useLocalePath();
const { locale } = useI18n();
const route = useRoute();

const auth = useAuth();
const username = ref("");
const password = ref("");
const isLoading = ref(false);
const mode = ref<"login" | "signup">(route.query.mode === "signup" ? "signup" : "login");
const statusMessage = ref(route.query.error === "sso" ? t("LoginPage.errors.sso") : "");
const homePath = computed(() => localePath("/", locale.value));
const submitLabel = computed(() => {
	return mode.value === "login" ? t("login") : t("LoginPage.actions.createAccount");
});
const githubLoginUrl = computed(() => {
	return `/api/auth/sso/github?redirect=${encodeURIComponent(homePath.value)}`;
});

async function submitAuth() {
	isLoading.value = true;
	statusMessage.value = "";

	const success =
		mode.value === "login"
			? await auth.login(username.value, password.value)
			: await auth.register(username.value, password.value);

	if (!success) {
		isLoading.value = false;
		statusMessage.value =
			mode.value === "login" ? t("WrongCredentials") : t("LoginPage.errors.signup");
		return;
	}
	return await navigateTo(homePath.value);
}

function setMode(nextMode: "login" | "signup") {
	mode.value = nextMode;
	statusMessage.value = "";
}

onBeforeMount(async () => {
	if (auth.isLoggedIn()) await navigateTo(localeRoute("/", locale.value));
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
							{{ submitLabel }}
						</Button>
						<div class="flex items-center justify-center gap-1 text-sm text-muted-foreground">
							<span>
								{{
									mode === "login"
										? t("LoginPage.prompts.noAccount")
										: t("LoginPage.prompts.hasAccount")
								}}
							</span>
							<Button
								class="px-1"
								type="button"
								variant="link"
								@click="setMode(mode === 'login' ? 'signup' : 'login')"
							>
								{{
									mode === "login"
										? t("LoginPage.actions.createAccount")
										: t("LoginPage.actions.loginInstead")
								}}
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
