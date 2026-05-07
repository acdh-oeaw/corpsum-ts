<script setup lang="ts">
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

interface CredentialListItem {
	noskeinstance: string;
	noskeName: string;
	username: string;
}

interface CredentialFormState {
	username: string;
	password: string;
	isSaving: boolean;
	isDeleting: boolean;
	error: string;
	success: string;
}

const t = useTranslations();
const { data: instancesData } = useGetNoskeinstances(null);
const { data: credentials, refresh: refreshCredentials } = await useFetch<
	Array<CredentialListItem>
>("/api/credentials", {
	default: () => [],
});

const instances = computed<Array<PopulatedNoskeDocument>>(() => {
	if (!instancesData.value) return [];
	const values = Array.isArray(instancesData.value) ? instancesData.value : [instancesData.value];
	return values.filter((instance) => instance.authentication !== "none");
});

const credentialByInstanceId = computed(() => {
	const map = new Map<string, CredentialListItem>();
	(credentials.value ?? []).forEach((credential) => {
		map.set(credential.noskeinstance, credential);
	});
	return map;
});

const formState = reactive<Record<string, CredentialFormState>>({});
const manuallyEnabledFields = reactive(new Set<string>());

function credentialFieldKey(instanceId: string, field: "username" | "password") {
	return `${instanceId}:${field}`;
}

function isCredentialFieldReadonly(instanceId: string, field: "username" | "password") {
	return !manuallyEnabledFields.has(credentialFieldKey(instanceId, field));
}

function enableCredentialField(instanceId: string, field: "username" | "password") {
	manuallyEnabledFields.add(credentialFieldKey(instanceId, field));
}

function getState(instance: PopulatedNoskeDocument): CredentialFormState {
	const existing = credentialByInstanceId.value.get(instance._id);
	if (!formState[instance._id]) {
		formState[instance._id] = {
			username: existing?.username ?? "",
			password: "",
			isSaving: false,
			isDeleting: false,
			error: "",
			success: "",
		};
	}
	const state = formState[instance._id]!;
	if (existing && !state.username) {
		state.username = existing.username;
	}
	return state;
}

function clearFeedback(state: CredentialFormState) {
	state.error = "";
	state.success = "";
}

async function saveCredential(instance: PopulatedNoskeDocument) {
	const state = getState(instance);
	clearFeedback(state);

	if (!state.username.trim() || !state.password) {
		state.error = t("CredentialsPage.messages.required");
		return;
	}

	state.isSaving = true;
	try {
		await $fetch(`/api/credentials/${instance._id}`, {
			method: "PUT",
			body: {
				username: state.username.trim(),
				password: state.password,
			},
		});
		state.password = "";
		state.success = t("CredentialsPage.messages.saved");
		await refreshCredentials();
	} catch {
		state.error = t("CredentialsPage.messages.saveFailed");
	} finally {
		state.isSaving = false;
	}
}

async function deleteCredential(instance: PopulatedNoskeDocument) {
	const state = getState(instance);
	clearFeedback(state);
	state.isDeleting = true;
	try {
		await $fetch(`/api/credentials/${instance._id}`, { method: "DELETE" });
		state.username = "";
		state.password = "";
		state.success = t("CredentialsPage.messages.deleted");
		await refreshCredentials();
	} catch {
		state.error = t("CredentialsPage.messages.deleteFailed");
	} finally {
		state.isDeleting = false;
	}
}
</script>

<template>
	<MainContent class="w-full min-w-0">
		<div class="my-10 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
					<LucideIcon class="size-8 text-foreground" name="LockKeyhole" :stroke-width="2" />
				</div>
				<PageTitle>{{ t("CredentialsPage.title") }}</PageTitle>
			</div>
		</div>

		<div class="grid gap-3">
			<Card
				v-for="instance in instances"
				:key="instance._id"
				class="overflow-hidden rounded-sm border-2 border-primary/40 shadow-sm"
			>
				<CardHeader class="gap-2 border-b border-primary bg-primary text-primary-foreground">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<CardTitle class="text-2xl font-black tracking-normal">
								{{ instance.name }}
							</CardTitle>
							<CardDescription class="font-semibold text-primary-foreground/80">
								{{ instance.host }}
							</CardDescription>
						</div>
						<div class="flex flex-wrap justify-end gap-2">
							<MetaBadge
								:label="t('NoskeInstanceCard.authentication')"
								tone="sky"
								:value="instance.authentication"
							>
								<template #icon>
									<LucideIcon class="size-3" name="ShieldCheck" :stroke-width="2" />
								</template>
							</MetaBadge>
							<MetaBadge
								:label="t('Actions.credentials')"
								:tone="credentialByInstanceId.has(instance._id) ? 'green' : 'red'"
								:value="
									credentialByInstanceId.has(instance._id)
										? t('CredentialsPage.status.configured')
										: t('CredentialsPage.status.missing')
								"
							>
								<template #icon>
									<LucideIcon
										class="size-3"
										:name="credentialByInstanceId.has(instance._id) ? 'KeyRound' : 'TriangleAlert'"
										:stroke-width="2"
									/>
								</template>
							</MetaBadge>
						</div>
					</div>
				</CardHeader>
				<CardContent class="pt-6">
					<form
						autocomplete="off"
						class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
						@submit.prevent="saveCredential(instance)"
					>
						<input
							aria-hidden="true"
							autocomplete="username"
							class="sr-only"
							name="username"
							tabindex="-1"
							type="text"
						/>
						<input
							aria-hidden="true"
							autocomplete="current-password"
							class="sr-only"
							name="password"
							tabindex="-1"
							type="password"
						/>
						<div class="grid gap-2">
							<Label :for="`credential-username-${instance._id}`">
								{{ t("CredentialsPage.labels.username") }}
							</Label>
							<Input
								:id="`credential-username-${instance._id}`"
								v-model="getState(instance).username"
								autocomplete="off"
								:disabled="getState(instance).isSaving || getState(instance).isDeleting"
								:name="`noske-credential-user-${instance._id}`"
								:readonly="isCredentialFieldReadonly(instance._id, 'username')"
								spellcheck="false"
								type="text"
								@focus="enableCredentialField(instance._id, 'username')"
							/>
						</div>
						<div class="grid gap-2">
							<Label :for="`credential-password-${instance._id}`">
								{{ t("CredentialsPage.labels.password") }}
							</Label>
							<Input
								:id="`credential-password-${instance._id}`"
								v-model="getState(instance).password"
								autocomplete="new-password"
								:disabled="getState(instance).isSaving || getState(instance).isDeleting"
								:name="`noske-credential-secret-${instance._id}`"
								:placeholder="
									credentialByInstanceId.has(instance._id)
										? t('CredentialsPage.placeholders.keepExistingPassword')
										: ''
								"
								:readonly="isCredentialFieldReadonly(instance._id, 'password')"
								type="password"
								@focus="enableCredentialField(instance._id, 'password')"
							/>
						</div>
						<div class="flex gap-2">
							<Button
								:disabled="getState(instance).isSaving || getState(instance).isDeleting"
								type="submit"
							>
								<LucideIcon class="mr-1 size-4" name="Save" :stroke-width="2" />
								{{ t("Actions.save") }}
							</Button>
							<Button
								:disabled="
									!credentialByInstanceId.has(instance._id) ||
									getState(instance).isSaving ||
									getState(instance).isDeleting
								"
								type="button"
								variant="outline"
								@click="deleteCredential(instance)"
							>
								<LucideIcon class="mr-1 size-4" name="Trash2" :stroke-width="2" />
								{{ t("Actions.delete") }}
							</Button>
						</div>
					</form>
					<p v-if="getState(instance).error" class="mt-3 text-sm text-destructive" role="alert">
						{{ getState(instance).error }}
					</p>
					<p v-else-if="getState(instance).success" class="mt-3 text-sm text-muted-foreground">
						{{ getState(instance).success }}
					</p>
				</CardContent>
			</Card>
		</div>
	</MainContent>
</template>
