<script setup lang="ts">
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";
import type { QueryResponse } from "~/server/api/query/[id].get.ts";

const t = useTranslations();
const route = useRoute();
const localeRoute = useLocaleRoute();
const auth = useAuth();

const queryId = computed(() => {
	const idParam = route.params.id;
	return Array.isArray(idParam) ? idParam[0] : idParam;
});

const { data: query } = await useFetch<QueryResponse>(() => `/api/query/${queryId.value}`);

const { data: instancesData } = useGetNoskeinstances(null);
const noskeInstances = computed<Array<PopulatedNoskeDocument>>(() => {
	if (!instancesData.value) return [];
	return Array.isArray(instancesData.value) ? instancesData.value : [instancesData.value];
});

const isSaving = ref(false);
const setSaving = (value: boolean) => {
	isSaving.value = value;
};

const isOwner = computed(
	() => query.value?.owner.some((owner) => owner.username === auth.username) ?? false,
);

const initialValues = computed(() => {
	if (!query.value) return {};
	return {
		name: query.value.name,
		noske: query.value.noske,
		corpus: query.value.corpus,
		subCorpus: query.value.subCorpus,
		type: query.value.type,
		userInput: query.value.userInput,
		facettingValuesText: JSON.stringify(query.value.facettingValues, null, 2),
	};
});
const formId = "query-form";

async function save(payload: {
	name: string;
	noske: string;
	corpus: string;
	subCorpus: string;
	type: QueryResponse["type"];
	userInput: string;
	facettingValues: unknown;
}) {
	if (!isOwner.value || !queryId.value || isSaving.value) return;
	setSaving(true);
	try {
		const updated = await $fetch<QueryResponse>(`/api/query/${queryId.value}`, {
			method: "PATCH",
			body: {
				name: payload.name,
				noske: payload.noske,
				corpus: payload.corpus,
				subCorpus: payload.subCorpus,
				type: payload.type,
				userInput: payload.userInput,
				facettingValues: payload.facettingValues,
			},
		});
		query.value = updated;
		await navigateTo(localeRoute(`/query/${updated._id}`));
	} finally {
		setSaving(false);
	}
}

function cancel() {
	if (!queryId.value) return;
	navigateTo(localeRoute(`/query/${queryId.value}`));
}
</script>

<template>
	<MainContent v-if="query" class="my-4 flex w-full min-w-0 flex-col gap-4">
		<div class="my-10 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
					<LucideIcon class="size-8 text-foreground" name="Terminal" :stroke-width="2" />
				</div>
				<PageTitle>{{ query.name }}</PageTitle>
			</div>
			<div class="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
				<Button
					v-if="isOwner"
					:disabled="isSaving"
					:form="formId"
					size="sm"
					type="submit"
					variant="ghost"
				>
					<LucideIcon class="mr-1 size-4" name="Save" :stroke-width="2" />
					{{ t("Actions.save") }}
				</Button>
				<Button size="sm" type="button" variant="ghost" @click="cancel">
					<LucideIcon class="mr-1 size-4" name="X" :stroke-width="2" />
					{{ t("Actions.cancel") }}
				</Button>
			</div>
		</div>
		<p v-if="!isOwner" class="text-sm text-muted-foreground">
			{{ t("Permissions.queryEditDisabled") }}
		</p>
		<QueryForm
			v-if="isOwner"
			:form-id="formId"
			:initial-values="initialValues"
			:is-saving="isSaving"
			:noske-instances="noskeInstances"
			:show-actions="false"
			:submit-label="t('Actions.save')"
			@cancel="cancel"
			@submit="save"
		/>
	</MainContent>
</template>
