<script setup lang="ts">
import { useForm } from "@tanstack/vue-form";

import type { components } from "~/lib/noske-types";
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";
import type { QueryResponse } from "~/server/api/query/[id].get.ts";

const t = useTranslations();

type QueryType = QueryResponse["type"];
type CorporaListItem = components["schemas"]["03_corpora_list"];
interface FacettingRegexSearch {
	key: string;
	value: string;
}
type FacettingValues = Record<string, Array<string> | FacettingRegexSearch>;

interface QueryFormValues {
	name: string;
	noske: string;
	corpus: string;
	subCorpus: string;
	type: QueryType;
	userInput: string;
	facettingValuesText: string;
}

const typeOptions: Array<QueryType> = [
	"charrow",
	"cqlrow",
	"iqueryrow",
	"lemmarow",
	"phraserow",
	"wordrow",
];

const props = withDefaults(
	defineProps<{
		noskeInstances: Array<PopulatedNoskeDocument>;
		isSaving?: boolean;
		submitLabel?: string;
		initialValues?: Partial<QueryFormValues>;
		showActions?: boolean;
		formId?: string;
	}>(),
	{
		isSaving: false,
		submitLabel: "Create",
		initialValues: () => ({}),
		showActions: true,
		formId: undefined,
	},
);

const toSnakeCaseDate = (value: Date) =>
	value
		.toISOString()
		.replace(/[^a-z0-9]+/gi, "_")
		.replace(/^_+|_+$/g, "")
		.toLowerCase();

const fallbackName = toSnakeCaseDate(new Date());

const emit = defineEmits<{
	(
		event: "submit",
		payload: {
			name: string;
			noske: string;
			corpus: string;
			subCorpus: string;
			type: QueryType;
			userInput: string;
			facettingValues: unknown;
		},
	): void;
	(event: "cancel"): void;
}>();

const emptyValues: QueryFormValues = {
	name: "",
	noske: "",
	corpus: "",
	subCorpus: "",
	type: "wordrow",
	userInput: "",
	facettingValuesText: "{}",
};

const resolveValues = (values?: Partial<QueryFormValues>) => {
	const resolved = {
		...emptyValues,
		...(values ?? {}),
	};
	return {
		...resolved,
		name: values?.name?.trim() ? values.name.trim() : fallbackName,
	};
};

const requiredText =
	(label: string) =>
	({ value }: { value: string }) =>
		typeof value === "string" && value.trim()
			? undefined
			: t("QueryForm.validation.required", {
					label,
				});

const jsonValidator = ({ value }: { value: string }) => {
	if (typeof value !== "string" || !value.trim()) {
		return undefined;
	}
	try {
		JSON.parse(value);
		return undefined;
	} catch {
		return t("QueryForm.validation.facettingInvalidJson");
	}
};

const typeValidator = ({ value }: { value: QueryType }) =>
	typeOptions.includes(value)
		? undefined
		: t("QueryForm.validation.required", { label: t("QueryForm.labels.type") });

const hasError = (state: { meta?: { errors?: Array<unknown> } }) =>
	Boolean(state?.meta?.errors?.some(Boolean));

const firstError = (state: { meta?: { errors?: Array<unknown> } }) => {
	const error = state?.meta?.errors?.find(Boolean);
	if (typeof error === "string") return error;
	if (error && typeof error === "object" && "message" in error) {
		return String((error as { message?: unknown }).message ?? "Invalid value.");
	}
	return error ? t("QueryForm.validation.invalidValue") : "";
};

const errorClass = (state: { meta?: { errors?: Array<unknown> } }) =>
	hasError(state) ? "border-destructive focus-visible:ring-destructive" : "";

const form = useForm({
	defaultValues: resolveValues(props.initialValues),
	onSubmit: async ({ value }) => {
		const safeTrim = (input: string | undefined | null) => input?.trim() ?? "";
		const trimmed = {
			name: safeTrim(value.name) || fallbackName,
			noske: safeTrim(value.noske),
			corpus: safeTrim(value.corpus),
			subCorpus: safeTrim(value.subCorpus),
			type: value.type,
			userInput: safeTrim(value.userInput),
			facettingValuesText: safeTrim(value.facettingValuesText),
		};

		let facettingValues: unknown = {};
		if (trimmed.facettingValuesText) {
			try {
				facettingValues = JSON.parse(trimmed.facettingValuesText);
			} catch {
				return;
			}
		}

		emit("submit", {
			name: trimmed.name,
			noske: trimmed.noske,
			corpus: trimmed.corpus,
			subCorpus: trimmed.subCorpus,
			type: trimmed.type,
			userInput: trimmed.userInput,
			facettingValues,
		});
	},
});

const noskeId = form.useStore((state) => state.values.noske);
const corpusId = form.useStore((state) => state.values.corpus);
const userInput = form.useStore((state) => state.values.userInput);
const facettingValuesText = form.useStore((state) => state.values.facettingValuesText);
const facettingModalOpen = ref(false);
const { useNoskeQuery } = useNoskeClient(noskeId);
const corporaQuery = useNoskeQuery<Array<CorporaListItem>>({
	queryKey: computed(() => ["noske-corpora", noskeId.value]),
	initialData: [],
	async queryFn(client) {
		const { data, error } = await client.GET("/ca/api/corpora");
		if (error) throw error;
		return data?.data ?? [];
	},
});
const corpora = computed<Array<CorporaListItem>>(() => corporaQuery.data.value ?? []);
const corporaPending = corporaQuery.isPending;

type SubcorpusListItem = NonNullable<components["schemas"]["01_corp_info"]["subcorpora"]>[number];

const subcorporaQuery = useNoskeQuery<Array<SubcorpusListItem>>({
	queryKey: computed(() => ["noske-subcorpora", noskeId.value, corpusId.value]),
	enabled: computed(() => Boolean(corpusId.value?.trim())),
	initialData: [],
	async queryFn(client) {
		const { data, error } = await client.GET("/search/corp_info", {
			params: {
				query: {
					corpname: corpusId.value,
					subcorpora: 1,
				},
			},
		});
		if (error) throw error;
		return data?.subcorpora ?? [];
	},
});
const subcorpora = computed<Array<SubcorpusListItem>>(() => subcorporaQuery.data.value ?? []);
const subcorporaPending = subcorporaQuery.isPending;

const parseFacettingValues = (raw: string): FacettingValues => {
	try {
		const parsed = JSON.parse(raw) as FacettingValues;
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
};

const facettingValues = computed<FacettingValues>(() =>
	parseFacettingValues(facettingValuesText.value),
);

const cleanFacettingValues = (values: FacettingValues) => {
	return Object.fromEntries(
		Object.entries(values).filter(([, value]) => {
			if (Array.isArray(value)) return value.length > 0;
			return Boolean(value?.value);
		}),
	) as FacettingValues;
};

const facettingEntries = computed(
	() => Object.entries(facettingValues.value ?? {}) as Array<[string, FacettingValues[string]]>,
);

const facettingQueryContext = computed(() => ({
	noske: noskeId.value,
	corpus: corpusId.value,
	userInput: userInput.value,
}));

watch(noskeId, (value, previous) => {
	if (value !== previous) {
		form.setFieldValue("corpus", "");
		form.setFieldValue("subCorpus", "");
	}
});

watch(corpusId, (value, previous) => {
	if (value !== previous) {
		form.setFieldValue("subCorpus", "");
	}
});
</script>

<template>
	<form
		:id="props.formId"
		class="mt-4 flex w-full flex-col gap-4"
		@submit.prevent="form.handleSubmit"
	>
		<div class="grid gap-6 lg:grid-cols-2">
			<div class="flex flex-col gap-4">
				<component
					:is="form.Field"
					v-slot="{ field, state }"
					name="name"
					:validators="{ onChange: requiredText(t('QueryForm.labels.name')) }"
				>
					<div class="grid gap-2">
						<label class="text-sm font-medium" for="name">{{ t("QueryForm.labels.name") }}</label>
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
					name="noske"
					:validators="{ onChange: requiredText(t('QueryForm.labels.noske')) }"
				>
					<div class="grid gap-2">
						<label class="text-sm font-medium" for="noske">
							{{ t("QueryForm.labels.noske") }}
						</label>
						<div
							:aria-describedby="hasError(state) ? 'noske-error' : undefined"
							:aria-invalid="hasError(state)"
							class="rounded-md"
							:class="hasError(state) ? 'ring-1 ring-destructive' : ''"
						>
							<NoskeInstanceComboBox
								:data="props.noskeInstances"
								:disabled="props.isSaving"
								:model-value="field.state.value || null"
								@update:model-value="(value) => field.handleChange(value ?? '')"
							/>
						</div>
						<p
							v-if="hasError(state)"
							id="noske-error"
							class="text-xs text-destructive"
							role="alert"
						>
							{{ firstError(state) }}
						</p>
					</div>
				</component>

				<component
					:is="form.Field"
					v-slot="{ field, state }"
					name="corpus"
					:validators="{ onChange: requiredText(t('QueryForm.labels.corpus')) }"
				>
					<div class="grid gap-2">
						<label class="text-sm font-medium" for="corpus">
							{{ t("QueryForm.labels.corpus") }}
						</label>
						<div
							:aria-describedby="hasError(state) ? 'corpus-error' : undefined"
							:aria-invalid="hasError(state)"
							class="rounded-md"
							:class="hasError(state) ? 'ring-1 ring-destructive' : ''"
						>
							<CorpusComboBox
								:data="corpora"
								:disabled="props.isSaving || !noskeId"
								:model-value="field.state.value || null"
								@update:model-value="(value) => field.handleChange(value ?? '')"
							/>
						</div>
						<p v-if="corporaPending && noskeId" class="text-xs text-muted-foreground">
							{{ t("QueryForm.messages.corporaLoading") }}
						</p>
						<p v-else-if="noskeId && corpora.length" class="text-xs text-muted-foreground">
							{{ t("QueryForm.messages.corporaAvailable", { count: corpora.length }) }}
						</p>
						<p v-else-if="!noskeId" class="text-xs text-muted-foreground">
							{{ t("QueryForm.messages.selectNoskeForCorpora") }}
						</p>
						<p
							v-if="hasError(state)"
							id="corpus-error"
							class="text-xs text-destructive"
							role="alert"
						>
							{{ firstError(state) }}
						</p>
					</div>
				</component>

				<component :is="form.Field" v-slot="{ field, state }" name="subCorpus">
					<div class="grid gap-2">
						<label class="text-sm font-medium" for="subCorpus">
							{{ t("QueryForm.labels.subCorpus") }}
						</label>
						<div
							:aria-describedby="hasError(state) ? 'subcorpus-error' : undefined"
							:aria-invalid="hasError(state)"
							class="rounded-md"
							:class="hasError(state) ? 'ring-1 ring-destructive' : ''"
						>
							<SubCorpusComboBox
								:data="subcorpora"
								:disabled="props.isSaving || !corpusId"
								:model-value="field.state.value || null"
								@update:model-value="(value) => field.handleChange(value ?? '')"
							/>
						</div>
						<p v-if="subcorporaPending && corpusId" class="text-xs text-muted-foreground">
							{{ t("QueryForm.messages.subcorporaLoading") }}
						</p>
						<p v-else-if="corpusId && subcorpora.length" class="text-xs text-muted-foreground">
							{{ t("QueryForm.messages.subcorporaAvailable", { count: subcorpora.length }) }}
						</p>
						<p v-else-if="!corpusId" class="text-xs text-muted-foreground">
							{{ t("QueryForm.messages.selectCorpusForSubcorpora") }}
						</p>
						<p
							v-if="hasError(state)"
							id="subcorpus-error"
							class="text-xs text-destructive"
							role="alert"
						>
							{{ firstError(state) }}
						</p>
					</div>
				</component>
			</div>

			<div class="flex flex-col gap-4">
				<component
					:is="form.Field"
					v-slot="{ field, state }"
					name="type"
					:validators="{ onChange: typeValidator }"
				>
					<div class="grid gap-2">
						<label class="text-sm font-medium" for="type">{{ t("QueryForm.labels.type") }}</label>
						<select
							id="type"
							:aria-describedby="hasError(state) ? 'type-error' : undefined"
							:aria-invalid="hasError(state)"
							class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							:class="errorClass(state)"
							:disabled="props.isSaving"
							:value="field.state.value"
							@blur="field.handleBlur"
							@change="
								field.handleChange(
									($event.target as HTMLSelectElement).value as QueryFormValues['type'],
								)
							"
						>
							<option v-for="option in typeOptions" :key="option" :value="option">
								{{ option }}
							</option>
						</select>
						<p v-if="hasError(state)" id="type-error" class="text-xs text-destructive" role="alert">
							{{ firstError(state) }}
						</p>
					</div>
				</component>

				<component
					:is="form.Field"
					v-slot="{ field, state }"
					name="userInput"
					:validators="{ onChange: requiredText(t('QueryForm.labels.userInput')) }"
				>
					<div class="grid gap-2">
						<label class="text-sm font-medium" for="userInput">
							{{ t("QueryForm.labels.userInput") }}
						</label>
						<textarea
							id="userInput"
							:aria-describedby="hasError(state) ? 'userinput-error' : undefined"
							:aria-invalid="hasError(state)"
							class="min-h-[4.5rem] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm"
							:class="errorClass(state)"
							:disabled="props.isSaving"
							rows="3"
							:value="field.state.value"
							@blur="field.handleBlur"
							@input="field.handleChange(($event.target as HTMLTextAreaElement).value)"
						/>
						<p
							v-if="hasError(state)"
							id="userinput-error"
							class="text-xs text-destructive"
							role="alert"
						>
							{{ firstError(state) }}
						</p>
					</div>
				</component>

				<component
					:is="form.Field"
					v-slot="{ field, state }"
					name="facettingValuesText"
					:validators="{ onChange: jsonValidator }"
				>
					<div class="grid gap-2">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<label class="text-sm font-medium" for="facettingValues">
								{{ t("QueryForm.labels.facettingValues") }}
							</label>
							<Button
								:disabled="props.isSaving || !noskeId || !corpusId"
								size="sm"
								type="button"
								variant="outline"
								@click="facettingModalOpen = true"
							>
								{{ t("QueryForm.actions.editFacetting") }}
							</Button>
						</div>
						<div
							id="facettingValues"
							:aria-describedby="hasError(state) ? 'facetting-error' : undefined"
							:aria-invalid="hasError(state)"
							class="overflow-hidden rounded-md border"
							:class="errorClass(state)"
						>
							<table class="min-w-full text-sm">
								<thead class="bg-muted/40 text-left">
									<tr>
										<th class="px-3 py-2 font-medium">
											{{ t("QueryForm.table.attribute") }}
										</th>
										<th class="px-3 py-2 font-medium">
											{{ t("QueryForm.table.value") }}
										</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="[key, value] in facettingEntries" :key="key">
										<td class="px-3 py-2 font-medium">{{ key }}</td>
										<td class="px-3 py-2">
											<span v-if="Array.isArray(value)">
												{{ value.join(", ") || "—" }}
											</span>
											<span v-else>
												{{ value.value || "—" }}
											</span>
										</td>
									</tr>
									<tr v-if="facettingEntries.length === 0">
										<td class="px-3 py-2 text-sm text-muted-foreground" colspan="2">
											{{ t("QueryForm.messages.noFacettingValues") }}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
						<FacettingModal
							:model-value="facettingValues"
							:open="facettingModalOpen"
							:query="facettingQueryContext"
							@update:model-value="
								(value) => field.handleChange(JSON.stringify(cleanFacettingValues(value), null, 2))
							"
							@update:open="facettingModalOpen = $event"
						/>
						<p
							v-if="hasError(state)"
							id="facetting-error"
							class="text-xs text-destructive"
							role="alert"
						>
							{{ firstError(state) }}
						</p>
					</div>
				</component>
			</div>
		</div>

		<div v-if="props.showActions" class="flex flex-wrap gap-2">
			<Button :disabled="props.isSaving" type="submit">{{ props.submitLabel }}</Button>
			<Button :disabled="props.isSaving" type="button" variant="outline" @click="emit('cancel')">
				{{ t("QueryForm.actions.cancel") }}
			</Button>
		</div>
	</form>
</template>
