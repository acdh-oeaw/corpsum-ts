<script setup lang="ts">
import { useForm } from "@tanstack/vue-form";

import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

const t = useTranslations();

type NoskeVersion = PopulatedNoskeDocument["version"];
type NoskeAuth = PopulatedNoskeDocument["authentication"];

interface NoskeFormValues {
	name: string;
	base: string;
	host: string;
	public: boolean;
	version: NoskeVersion;
	authentication: NoskeAuth;
}

const versionOptions: Array<NoskeVersion> = ["openapi", "bonito"];
const authOptions: Array<NoskeAuth> = ["none", "basic"];

const props = withDefaults(
	defineProps<{
		isSaving?: boolean;
		submitLabel?: string;
		resetLabel?: string;
		showReset?: boolean;
		initialValues?: Partial<NoskeFormValues>;
	}>(),
	{
		isSaving: false,
		submitLabel: "Create",
		resetLabel: "Reset",
		showReset: false,
		initialValues: () => ({}),
	},
);

const emit = defineEmits<{
	(
		event: "submit",
		payload: {
			name: string;
			base: string;
			host: string;
			public: boolean;
			version: NoskeVersion;
			authentication: NoskeAuth;
		},
	): void;
	(event: "cancel"): void;
}>();

const emptyValues: NoskeFormValues = {
	name: "",
	base: "",
	host: "",
	public: false,
	version: "openapi",
	authentication: "none",
};

const resolveValues = (values?: Partial<NoskeFormValues>) => ({
	...emptyValues,
	...(values ?? {}),
});

const requiredText =
	(label: string) =>
	({ value }: { value: string }) =>
		value.trim()
			? undefined
			: t("NoskeForm.validation.required", {
					label,
				});

const optionValidator = <T extends string>(options: Array<T>, label: string) => {
	return ({ value }: { value: T }) =>
		options.includes(value)
			? undefined
			: t("NoskeForm.validation.required", {
					label,
				});
};

const hasError = (state: { meta?: { errors?: Array<unknown> } }) =>
	Boolean(state?.meta?.errors?.some(Boolean));

const firstError = (state: { meta?: { errors?: Array<unknown> } }) => {
	const error = state?.meta?.errors?.find(Boolean);
	if (typeof error === "string") return error;
	if (error && typeof error === "object" && "message" in error) {
		return String((error as { message?: unknown }).message ?? "Invalid value.");
	}
	return error ? t("NoskeForm.validation.invalidValue") : "";
};

const errorClass = (state: { meta?: { errors?: Array<unknown> } }) =>
	hasError(state) ? "border-destructive focus-visible:ring-destructive" : "";

const form = useForm({
	defaultValues: resolveValues(props.initialValues),
	onSubmit: async ({ value }) => {
		emit("submit", {
			name: value.name.trim(),
			base: value.base.trim(),
			host: value.host.trim(),
			public: value.public,
			version: value.version,
			authentication: value.authentication,
		});
	},
});

watch(
	() => props.initialValues,
	(values) => {
		form.reset(resolveValues(values));
	},
	{ deep: true },
);

const handleReset = () => {
	form.reset(resolveValues(props.initialValues));
};
</script>

<template>
	<form class="mt-4 flex max-w-2xl flex-col gap-4" @submit.prevent="form.handleSubmit">
		<component
			:is="form.Field"
			v-slot="{ field, state }"
			name="name"
			:validators="{ onChange: requiredText(t('NoskeForm.labels.name')) }"
		>
			<div class="grid gap-2">
				<label class="text-sm font-medium" for="name">{{ t("NoskeForm.labels.name") }}</label>
				<Input
					id="name"
					:aria-describedby="hasError(state) ? 'name-error' : undefined"
					:aria-invalid="hasError(state)"
					:class="errorClass(state)"
					:disabled="props.isSaving"
					:model-value="field.state.value"
					type="text"
					@blur="field.handleBlur"
					@update:model-value="(value) => field.handleChange(String(value))"
				/>
				<p v-if="hasError(state)" id="name-error" class="text-xs text-destructive" role="alert">
					{{ firstError(state) }}
				</p>
			</div>
		</component>

		<component
			:is="form.Field"
			v-slot="{ field, state }"
			name="base"
			:validators="{ onChange: requiredText(t('NoskeForm.labels.base')) }"
		>
			<div class="grid gap-2">
				<label class="text-sm font-medium" for="base">{{ t("NoskeForm.labels.base") }}</label>
				<Input
					id="base"
					:aria-describedby="hasError(state) ? 'base-error' : undefined"
					:aria-invalid="hasError(state)"
					:class="errorClass(state)"
					:disabled="props.isSaving"
					:model-value="field.state.value"
					type="text"
					@blur="field.handleBlur"
					@update:model-value="(value) => field.handleChange(String(value))"
				/>
				<p v-if="hasError(state)" id="base-error" class="text-xs text-destructive" role="alert">
					{{ firstError(state) }}
				</p>
			</div>
		</component>

		<component
			:is="form.Field"
			v-slot="{ field, state }"
			name="host"
			:validators="{ onChange: requiredText(t('NoskeForm.labels.host')) }"
		>
			<div class="grid gap-2">
				<label class="text-sm font-medium" for="host">{{ t("NoskeForm.labels.host") }}</label>
				<Input
					id="host"
					:aria-describedby="hasError(state) ? 'host-error' : undefined"
					:aria-invalid="hasError(state)"
					:class="errorClass(state)"
					:disabled="props.isSaving"
					:model-value="field.state.value"
					type="text"
					@blur="field.handleBlur"
					@update:model-value="(value) => field.handleChange(String(value))"
				/>
				<p v-if="hasError(state)" id="host-error" class="text-xs text-destructive" role="alert">
					{{ firstError(state) }}
				</p>
			</div>
		</component>

		<component
			:is="form.Field"
			v-slot="{ field, state }"
			name="version"
			:validators="{ onChange: optionValidator(versionOptions, t('NoskeForm.labels.version')) }"
		>
			<div class="grid gap-2">
				<label class="text-sm font-medium" for="version">
					{{ t("NoskeForm.labels.version") }}
				</label>
				<select
					id="version"
					:aria-describedby="hasError(state) ? 'version-error' : undefined"
					:aria-invalid="hasError(state)"
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					:class="errorClass(state)"
					:disabled="props.isSaving"
					:value="field.state.value"
					@blur="field.handleBlur"
					@change="
						field.handleChange(
							($event.target as HTMLSelectElement).value as NoskeFormValues['version'],
						)
					"
				>
					<option v-for="option in versionOptions" :key="option" :value="option">
						{{ option }}
					</option>
				</select>
				<p v-if="hasError(state)" id="version-error" class="text-xs text-destructive" role="alert">
					{{ firstError(state) }}
				</p>
			</div>
		</component>

		<component
			:is="form.Field"
			v-slot="{ field, state }"
			name="authentication"
			:validators="{ onChange: optionValidator(authOptions, t('NoskeForm.labels.authentication')) }"
		>
			<div class="grid gap-2">
				<label class="text-sm font-medium" for="authentication">
					{{ t("NoskeForm.labels.authentication") }}
				</label>
				<select
					id="authentication"
					:aria-describedby="hasError(state) ? 'authentication-error' : undefined"
					:aria-invalid="hasError(state)"
					class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					:class="errorClass(state)"
					:disabled="props.isSaving"
					:value="field.state.value"
					@blur="field.handleBlur"
					@change="
						field.handleChange(
							($event.target as HTMLSelectElement).value as NoskeFormValues['authentication'],
						)
					"
				>
					<option v-for="option in authOptions" :key="option" :value="option">
						{{ option }}
					</option>
				</select>
				<p
					v-if="hasError(state)"
					id="authentication-error"
					class="text-xs text-destructive"
					role="alert"
				>
					{{ firstError(state) }}
				</p>
			</div>
		</component>

		<component :is="form.Field" v-slot="{ field }" name="public">
			<div class="flex items-center gap-2">
				<input
					id="public"
					:checked="field.state.value"
					class="size-4 rounded border border-input"
					:disabled="props.isSaving"
					type="checkbox"
					@blur="field.handleBlur"
					@change="field.handleChange(($event.target as HTMLInputElement).checked)"
				/>
				<label class="text-sm font-medium" for="public">
					{{ t("NoskeForm.labels.public") }}
				</label>
			</div>
		</component>

		<div class="flex flex-wrap gap-2">
			<Button :disabled="props.isSaving" type="submit">{{ props.submitLabel }}</Button>
			<Button
				v-if="props.showReset"
				:disabled="props.isSaving"
				type="button"
				variant="outline"
				@click="handleReset"
			>
				{{ props.resetLabel }}
			</Button>
			<Button :disabled="props.isSaving" type="button" variant="outline" @click="emit('cancel')">
				{{ t("NoskeForm.actions.cancel") }}
			</Button>
		</div>
	</form>
</template>
