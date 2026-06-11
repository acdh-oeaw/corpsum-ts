<script setup lang="ts">
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";
import type { QueryResponse } from "~/server/api/query/[id].get.ts";

const t = useTranslations();
const localeRoute = useLocaleRoute();
const route = useRoute();

const { data: instancesData } = useGetNoskeinstances(null);
const noskeInstances = computed<Array<PopulatedNoskeDocument>>(() => {
	if (!instancesData.value) return [];
	return Array.isArray(instancesData.value) ? instancesData.value : [instancesData.value];
});

const isSaving = ref(false);
const setSaving = (value: boolean) => {
	isSaving.value = value;
};

const queryTypes: ReadonlyArray<QueryResponse["type"]> = [
	"charrow",
	"cqlrow",
	"iquery",
	"lemmarow",
	"phraserow",
	"wordrow",
];

const getQueryString = (key: string) => {
	const raw = route.query[key];
	if (Array.isArray(raw)) {
		return typeof raw[0] === "string" ? raw[0] : undefined;
	}
	return typeof raw === "string" ? raw : undefined;
};

const getQueryType = () => {
	const type = getQueryString("type");
	return queryTypes.includes(type as QueryResponse["type"])
		? (type as QueryResponse["type"])
		: undefined;
};

const getFacettingValuesText = () => {
	const facettingValues = getQueryString("facettingValues");
	if (!facettingValues) return undefined;
	try {
		return JSON.stringify(JSON.parse(facettingValues), null, 2);
	} catch {
		return facettingValues;
	}
};

const initialValues = computed(() => ({
	name: getQueryString("name"),
	noske: getQueryString("noske"),
	corpus: getQueryString("corpus"),
	subCorpus: getQueryString("subCorpus"),
	type: getQueryType(),
	userInput: getQueryString("userInput"),
	facettingValuesText: getFacettingValuesText(),
}));
const formKey = computed(() => JSON.stringify(initialValues.value));
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
	if (isSaving.value) return;
	setSaving(true);
	try {
		const created = await $fetch<QueryResponse>("/api/query", {
			method: "POST",
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
		await navigateTo(localeRoute(`/query/${created._id}`));
	} finally {
		setSaving(false);
	}
}

function cancel() {
	navigateTo(localeRoute("/queries"));
}
</script>

<template>
	<MainContent class="my-4 flex w-full min-w-0 flex-col gap-4">
		<div class="my-10 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
					<LucideIcon class="size-8 text-foreground" name="Terminal" :stroke-width="2" />
				</div>
				<PageTitle>{{ t("Actions.newQuery") }}</PageTitle>
			</div>
			<div class="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
				<Button :disabled="isSaving" :form="formId" size="sm" type="submit" variant="ghost">
					<LucideIcon class="mr-1 size-4" name="Save" :stroke-width="2" />
					{{ t("Actions.create") }}
				</Button>
				<Button :disabled="isSaving" size="sm" type="button" variant="ghost" @click="cancel">
					<LucideIcon class="mr-1 size-4" name="X" :stroke-width="2" />
					{{ t("Actions.cancel") }}
				</Button>
			</div>
		</div>
		<QueryForm
			:key="formKey"
			:form-id="formId"
			:initial-values="initialValues"
			:is-saving="isSaving"
			:noske-instances="noskeInstances"
			:show-actions="false"
			:submit-label="t('Actions.create')"
			@cancel="cancel"
			@submit="save"
		/>
	</MainContent>
</template>
