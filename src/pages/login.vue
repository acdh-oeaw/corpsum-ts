<script lang="ts" setup>
import { cn } from '@/utils/styles'
const t = useTranslations("LoginPage");
definePageMeta({
	title: "LoginPage.meta.title",
});

const localeRoute = useLocaleRoute();
const { locale } = useI18n();

const auth = useAuth();
const username = ref("");
const password = ref("");
const isLoading = ref(false);

async function login() {
	console.log(username.value, password.value);
	isLoading.value = true;
	if (!(await auth.login(username.value, password.value))) {
		isLoading.value = false;
		return alert(t("WrongCredentials"))
	}
	return await navigateTo(localeRoute("/", locale.value));
}

onMounted(async () => {
	if (auth.isLoggedIn()) await navigateTo(localeRoute("/", locale.value));
});
</script>

<template>
	<div class="container relative hidden flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
		<div class="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
			<div class="absolute inset-0 bg-zinc-900" />
			<div class="relative text-7xl font-bold">
				CorpSum
			</div>
			<div class="relative mt-auto">
				<blockquote class="space-y-2">
					<p class="text-lg">
						&ldquo;This library has saved me countless hours of work and
						helped me deliver stunning designs to my clients faster than
						ever before.&rdquo;
					</p>
					<footer class="text-sm">
						Sofia Davis
					</footer>
				</blockquote>
			</div>
		</div>
		<div class="lg:p-8">
			<div :class="cn('grid gap-6', $attrs.class ?? '')">
				<form>
					<div class="grid gap-2">
						<div class="grid gap-1">
							<Input
								id="username"
								placeholder="username"
								type="text"
								v-model="username"
								:disabled="isLoading"
							/>
							<Input
								id="password"
								placeholder="password"
								type="password"
								v-model="password"
								:disabled="isLoading"
							/>
						</div>
						<Button variant="outline" type="submit" :disabled="isLoading" @click="login">
							{{ t("login") }}
						</Button>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>
