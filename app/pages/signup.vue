<script lang="ts" setup>
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";

import { defaultLocale, isValidLocale } from "@/config/i18n.config";
import {
	createSignupSchema,
	hasSignupErrors,
	passwordMinLength,
	validateSignupPayload,
	type NormalizedSignupPayload,
	type SignupField,
	type SignupFieldErrors,
	type SignupValidationCode,
} from "@/utils/auth-validation";
import { cn } from "@/utils/shadcn";

definePageMeta({
	title: "SignupPage.meta.title",
	layout: "full-page",
});

const t = useTranslations();
const route = useRoute();
const auth = useAuth();
const isLoading = ref(false);
const statusMessage = ref(route.query.error === "sso" ? t("LoginPage.errors.sso") : "");
const pageLocale = computed(() => {
	const locale = route.path.split("/")[1] ?? "";
	return isValidLocale(locale) ? locale : defaultLocale;
});
const homePath = computed(() => `/${pageLocale.value}`);
const loginPath = computed(() => `/${pageLocale.value}/login`);
const githubLoginUrl = computed(() => {
	const params = new URLSearchParams({
		redirect: homePath.value,
		errorRedirect: `/${pageLocale.value}/signup`,
	});
	return `/api/auth/sso/github?${params.toString()}`;
});

const emptyValues: NormalizedSignupPayload = {
	username: "",
	email: "",
	password: "",
	passwordConfirmation: "",
};

function errorMessage(code: SignupValidationCode, field: SignupField): string {
	if (code === "duplicate") {
		return field === "email"
			? t("SignupPage.validation.emailDuplicate")
			: t("SignupPage.validation.usernameDuplicate");
	}

	const messages: Record<Exclude<SignupValidationCode, "duplicate">, string> = {
		email: t("SignupPage.validation.email"),
		match: t("SignupPage.validation.passwordConfirmation"),
		password: t("SignupPage.validation.password", { min: passwordMinLength }),
		required: t("SignupPage.validation.required"),
		username: t("SignupPage.validation.username"),
	};
	return messages[code];
}

const signupFields: Array<SignupField> = ["username", "email", "password", "passwordConfirmation"];
const signupFormSchema = toTypedSchema(
	createSignupSchema({
		email: t("SignupPage.validation.email"),
		match: t("SignupPage.validation.passwordConfirmation"),
		password: t("SignupPage.validation.password", { min: passwordMinLength }),
		required: t("SignupPage.validation.required"),
		username: t("SignupPage.validation.username"),
	}),
);

const { defineField, errors, handleSubmit, setFieldError, validateField, values } =
	useForm<NormalizedSignupPayload>({
		initialValues: emptyValues,
		validationSchema: signupFormSchema,
	});

const [username, usernameAttrs] = defineField("username");
const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");
const [passwordConfirmation, passwordConfirmationAttrs] = defineField("passwordConfirmation");

function clearStatusMessage() {
	statusMessage.value = "";
}

function hasFieldError(field: SignupField) {
	return Boolean(errors.value[field]);
}

function fieldError(field: SignupField) {
	return errors.value[field] ?? "";
}

function applyFieldErrors(fieldErrors: SignupFieldErrors) {
	for (const field of signupFields) {
		const code = fieldErrors[field];
		if (code) setFieldError(field, errorMessage(code, field));
	}
}

const submitSignup = handleSubmit(async (formValues) => {
	statusMessage.value = "";

	const validation = validateSignupPayload(formValues);
	if (hasSignupErrors(validation.errors)) {
		applyFieldErrors(validation.errors);
		return;
	}

	isLoading.value = true;
	try {
		const result = await auth.register(validation.values);
		if (result.ok) {
			await navigateTo(homePath.value);
			return;
		}

		applyFieldErrors(result.errors);
		statusMessage.value = t("SignupPage.errors.failed");
	} finally {
		isLoading.value = false;
	}
});

watch(
	() => values.password,
	() => {
		if (values.passwordConfirmation) void validateField("passwordConfirmation");
	},
);

onBeforeMount(async () => {
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
				<form class="my-auto" @submit.prevent="submitSignup">
					<div class="grid gap-3">
						<div class="grid gap-1">
							<Label for="signup-username">{{ t("username") }}</Label>
							<Input
								id="signup-username"
								v-model="username"
								:aria-describedby="hasFieldError('username') ? 'signup-username-error' : undefined"
								:aria-invalid="hasFieldError('username')"
								autocomplete="username"
								:disabled="isLoading"
								name="username"
								spellcheck="false"
								type="text"
								v-bind="usernameAttrs"
								@update:model-value="clearStatusMessage"
							/>
							<p
								v-if="hasFieldError('username')"
								id="signup-username-error"
								class="text-xs text-destructive"
								role="alert"
							>
								{{ fieldError("username") }}
							</p>
						</div>

						<div class="grid gap-1">
							<Label for="signup-email">{{ t("SignupPage.labels.email") }}</Label>
							<Input
								id="signup-email"
								v-model="email"
								:aria-describedby="hasFieldError('email') ? 'signup-email-error' : undefined"
								:aria-invalid="hasFieldError('email')"
								autocomplete="email"
								:disabled="isLoading"
								name="email"
								spellcheck="false"
								type="email"
								v-bind="emailAttrs"
								@update:model-value="clearStatusMessage"
							/>
							<p
								v-if="hasFieldError('email')"
								id="signup-email-error"
								class="text-xs text-destructive"
								role="alert"
							>
								{{ fieldError("email") }}
							</p>
						</div>

						<div class="grid gap-1">
							<Label for="signup-password">{{ t("password") }}</Label>
							<Input
								id="signup-password"
								v-model="password"
								:aria-describedby="hasFieldError('password') ? 'signup-password-error' : undefined"
								:aria-invalid="hasFieldError('password')"
								autocomplete="new-password"
								:disabled="isLoading"
								name="password"
								type="password"
								v-bind="passwordAttrs"
								@update:model-value="clearStatusMessage"
							/>
							<p
								v-if="hasFieldError('password')"
								id="signup-password-error"
								class="text-xs text-destructive"
								role="alert"
							>
								{{ fieldError("password") }}
							</p>
						</div>

						<div class="grid gap-1">
							<Label for="signup-password-confirmation">
								{{ t("SignupPage.labels.passwordConfirmation") }}
							</Label>
							<Input
								id="signup-password-confirmation"
								v-model="passwordConfirmation"
								:aria-describedby="
									hasFieldError('passwordConfirmation')
										? 'signup-password-confirmation-error'
										: undefined
								"
								:aria-invalid="hasFieldError('passwordConfirmation')"
								autocomplete="new-password"
								:disabled="isLoading"
								name="passwordConfirmation"
								type="password"
								v-bind="passwordConfirmationAttrs"
								@update:model-value="clearStatusMessage"
							/>
							<p
								v-if="hasFieldError('passwordConfirmation')"
								id="signup-password-confirmation-error"
								class="text-xs text-destructive"
								role="alert"
							>
								{{ fieldError("passwordConfirmation") }}
							</p>
						</div>

						<p v-if="statusMessage" class="text-sm text-destructive" role="alert">
							{{ statusMessage }}
						</p>
						<Button :disabled="isLoading" type="submit" variant="outline">
							{{ t("LoginPage.actions.createAccount") }}
						</Button>
						<div class="flex items-center justify-center gap-1 text-sm text-muted-foreground">
							<span>{{ t("LoginPage.prompts.hasAccount") }}</span>
							<Button as-child class="px-1" type="button" variant="link">
								<NuxtLink :to="loginPath">
									{{ t("LoginPage.actions.loginInstead") }}
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
